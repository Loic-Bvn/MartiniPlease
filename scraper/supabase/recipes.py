"""
Import cocktails JSON -> Supabase
Usage: python import_to_supabase.py
"""

import json
import os
from supabase import create_client

# ─── Config ───────────────────────────────────────────────
SUPABASE_URL = "https://weeilvuklsxiqtljnyok.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlZWlsdnVrbHN4aXF0bGpueW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3OTI0NjcsImV4cCI6MjA4MzM2ODQ2N30.4pd4S_RdcEcyE-D0Mb4Cfr6zm0tTbTXYJOMj6Xzymv4"
JSON_FILE    = "../cocktails_autumn_winter_spring_summer_10-03-2026.json"
# ──────────────────────────────────────────────────────────

def import_cocktails(filepath: str):
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)

    cocktails = data.get("cocktails", [])
    print(f"📋 {len(cocktails)} cocktails à importer...")

    success, errors = 0, 0

    for i in range(0, len(cocktails), 50):
        batch = cocktails[i:i + 50]

        # Les clés du JSON sont en PascalCase (produites par le scraper)
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
    import_cocktails(JSON_FILE)