"""
Génère et importe la table `ingredients` depuis les `Type` présents dans les recettes.
Usage: python -m scraper.supabase.ingredients
"""

import sys
from collections import Counter
from supabase import create_client
from scraper.config import SUPABASE_URL, SUPABASE_KEY
from scraper.constants.ingredients_meta import TYPE_METADATA


def generate_ingredients():
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ SUPABASE_URL et SUPABASE_KEY doivent être définis dans le fichier .env")
        sys.exit(1)

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    rows = []
    for ing_type in sorted(TYPE_METADATA):
        meta = TYPE_METADATA.get(ing_type)
        rows.append({
            "type":      ing_type,
            "name":      meta[0] if meta else ing_type.replace("_", " ").title(),
            "category":  meta[1] if meta else "others",
            "abv":       meta[2] if meta else 0.0,
            "family":    meta[3] if meta else None,
            "available": False
        })

    print(f"\n📥 Import de {len(rows)} ingrédients dans Supabase...")
    try:
        supabase.table("ingredients").insert(rows).execute()
        print(f"✅ {len(rows)} ingrédients importés avec succès !")
    except Exception as e:
        print(f"❌ Erreur : {e}")

    print("\nRésumé par catégorie :")
    counter = Counter(r["category"] for r in rows)
    for cat, count in sorted(counter.items()):
        print(f"  {cat:12s} : {count} ingrédients")

    print("\nRésumé par famille :")
    counter = Counter(r["family"] for r in rows if r["family"])
    for fam, count in sorted(counter.items()):
        print(f"  {fam:25s} : {count} ingrédients")


if __name__ == "__main__":
    generate_ingredients()