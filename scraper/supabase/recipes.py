"""
Import/mise a jour cocktails JSON -> Supabase pour un bar specifique.
Strategie : upsert sur (name, bar_id) + suppression des cocktails absents du nouveau JSON.

Usage:
  python scraper/supabase/recipes.py <fichier.json> <bar_id>
  python scraper/supabase/recipes.py cocktails.json xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
"""

import json
import sys
from supabase import create_client
from scraper.config import SUPABASE_URL, SUPABASE_KEY


def import_cocktails(filepath: str, bar_id: str):
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ SUPABASE_URL et SUPABASE_KEY doivent être définis dans le fichier .env")
        sys.exit(1)

    if not bar_id:
        print("❌ bar_id manquant.")
        sys.exit(1)

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)

    cocktails = data.get("cocktails", [])
    new_names = {c["Name"] for c in cocktails if c.get("Name")}
    print(f"📋 {len(cocktails)} cocktails dans le JSON pour le bar {bar_id}")

    # ── 1. Récupérer les cocktails existants du bar ───────────────────────────
    print("\n[1/3] 🔍 Récupération des cocktails existants...")
    existing = supabase.table("cocktails").select("id, name").eq("bar_id", bar_id).execute()
    existing_rows = existing.data or []
    existing_by_name = {r["name"]: r["id"] for r in existing_rows}
    print(f"  → {len(existing_by_name)} cocktails existants trouvés")

    # ── 2. Supprimer les cocktails absents du nouveau JSON ────────────────────
    to_delete = [row_id for name, row_id in existing_by_name.items() if name not in new_names]
    if to_delete:
        print(f"\n[2/3] 🗑  Suppression de {len(to_delete)} cocktails retirés...")
        for i in range(0, len(to_delete), 100):
            batch_ids = to_delete[i:i + 100]
            supabase.table("cocktails").delete().in_("id", batch_ids).execute()
            print(f"  ✅ {len(batch_ids)} supprimés")
    else:
        print("\n[2/3] ✅ Aucun cocktail à supprimer")

    # ── 3. Upsert des cocktails du JSON ──────────────────────────────────────
    print(f"\n[3/3] 🔄 Upsert de {len(cocktails)} cocktails...")
    success, errors = 0, 0

    for i in range(0, len(cocktails), 50):
        batch = cocktails[i:i + 50]

        rows = [{
            "name":           c.get("Name"),
            "base_spirit":    c.get("BaseSpirit"),
            "category":       c.get("Category"),
            "glass":          c.get("Glass"),
            "method":         c.get("Method"),
            "difficulty":     c.get("Difficulty"),
            "abv":            c.get("ABV"),
            "description":    c.get("Description"),
            "profile":        c.get("Profile", []),
            "ice":            c.get("Ice", []),
            "season":         c.get("Season", []),
            "creator":        c.get("Creator"),
            "image":          c.get("Image"),
            "tags":           c.get("Tags", []),
            "cocktail_style": c.get("CocktailStyle"),
            "recipe":         c.get("Recipe", []),
            "bar_id":         bar_id,
        } for c in batch]

        try:
            supabase.table("cocktails").upsert(rows, on_conflict="name,bar_id").execute()
            success += len(rows)
            print(f"  ✅ Batch {i // 50 + 1} ({len(rows)} cocktails)")
        except Exception as e:
            errors += len(rows)
            print(f"  ❌ Erreur batch {i // 50 + 1}: {e}")

    print(f"\n{'='*40}")
    print(f"✅ Upsertés : {success}")
    print(f"🗑  Supprimés: {len(to_delete)}")
    print(f"❌ Erreurs  : {errors}")
    print(f"{'='*40}")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python scraper/supabase/recipes.py <fichier.json> <bar_id>")
        sys.exit(1)
    import_cocktails(sys.argv[1], sys.argv[2])