"""
Import cocktails JSON -> Supabase
Usage: python -m scraper.supabase.recipes <fichier.json> <bar_id>
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
        print("❌ bar_id manquant. Usage: python scraper/supabase/recipes.py <fichier.json> <bar_id>")
        sys.exit(1)

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)

    cocktails = data.get("cocktails", [])
    print(f"📋 {len(cocktails)} cocktails à importer pour le bar {bar_id}...")

    success, errors = 0, 0

    for i in range(0, len(cocktails), 50):
        batch = cocktails[i:i + 50]

        rows = [{
            "name":        c.get("Name"),
            "base_spirit": c.get("BaseSpirit"),
            "category":    c.get("Category"),
            "glass":       c.get("Glass"),
            "method":      c.get("Method"),
            "difficulty":  c.get("Difficulty"),
            "abv":         c.get("ABV"),
            "description": c.get("Description"),
            "profile":     c.get("Profile", []),
            "ice":         c.get("Ice", []),
            "season":      c.get("Season", []),
            "creator":     c.get("Creator"),
            "image":       c.get("Image"),
            "tags":        c.get("Tags", []),
            "recipe":      c.get("Recipe", []),
            "bar_id":      bar_id,
        } for c in batch]

        try:
            supabase.table("cocktails").insert(rows).execute()
            success += len(rows)
            print(f"  ✅ Batch {i // 50 + 1} importé ({len(rows)} cocktails)")
        except Exception as e:
            errors += len(rows)
            print(f"  ❌ Erreur batch {i // 50 + 1}: {e}")

    print(f"\n{'='*40}")
    print(f"✅ Importés : {success}")
    print(f"❌ Erreurs  : {errors}")
    print(f"{'='*40}")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python scraper/supabase/recipes.py <fichier.json> <bar_id>")
        sys.exit(1)
    import_cocktails(sys.argv[1], sys.argv[2])