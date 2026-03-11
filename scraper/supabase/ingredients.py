"""
Génère et importe la table `ingredients` depuis les `Type` présents dans les recettes.
Usage: python generate_ingredients.py

Pour chaque Type unique trouvé dans les recettes, on crée une entrée dans ingredients :
- type  : clé de matching (ex: "bourbon")
- name  : nom affiché (ex: "Bourbon")
- category : groupe (ex: "spirits")
- available : false par défaut
"""

# !pip install supabase
from supabase import create_client

# ─── Config ───────────────────────────────────────────────
SUPABASE_URL = "https://weeilvuklsxiqtljnyok.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlZWlsdnVrbHN4aXF0bGpueW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3OTI0NjcsImV4cCI6MjA4MzM2ODQ2N30.4pd4S_RdcEcyE-D0Mb4Cfr6zm0tTbTXYJOMj6Xzymv4"
# ──────────────────────────────────────────────────────────

# Mapping type -> (nom affiché, catégorie)
# Aligné sur INGREDIENT_RULES de detectors.py
TYPE_METADATA = {
    # ── Spiritueux ────────────────────────────────────────
    "bourbon":            ("Bourbon",              "spirits"),
    "rye":                ("Rye Whiskey",           "spirits"),
    "scotch":             ("Scotch Whisky",         "spirits"),
    "irish_whiskey":      ("Irish Whiskey",         "spirits"),
    "peated_whisky":      ("Islay Scotch",          "spirits"),
    "whiskey":            ("Whiskey",               "spirits"),
    "rum":                ("Rum",                   "spirits"),
    "rum_agricol":        ("Rhum Agricole",         "spirits"),
    "rum_cuban":          ("Rhum Cubain",           "spirits"),
    "rum_jamaican":       ("Rhum Jamaicain",        "spirits"),
    "rum_overproof":      ("Overproof Rhum",        "spirits"),
    "cachaca":            ("Cachaça",               "spirits"),
    "tequila":            ("Tequila",               "spirits"),
    "tequila_reposado":   ("Tequila Reposado",      "spirits"),
    "mezcal":             ("Mezcal",                "spirits"),
    "gin":                ("Gin",                   "spirits"),
    "gin_dry":            ("Dry Gin",               "spirits"),
    "gin_navy":           ("Navy Strength Gin",     "spirits"),
    "genever":            ("Genièvre",              "spirits"),
    "vodka":              ("Vodka",                 "spirits"),
    "cognac":             ("Cognac",                "spirits"),
    "brandy":             ("Brandy",                "spirits"),
    "calvados":           ("Calvados",              "spirits"),
    "pisco":              ("Pisco",                 "spirits"),
    "grappa":             ("Grappa",                "spirits"),
    "absinthe":           ("Absinthe",              "spirits"),
    "aquavit":            ("Aquavit",               "spirits"),

    # ── Liqueurs ──────────────────────────────────────────
    # Amers italiens
    "aperol":             ("Aperol",                "licors"),
    "campari":            ("Campari",               "licors"),
    "cynar":              ("Cynar",                 "licors"),
    "fernet_branca":      ("Fernet Branca",         "licors"),
    "amaro":              ("Amaro",                 "licors"),

    # Herbes / plantes
    "chartreuse_green":   ("Chartreuse Verte",      "licors"),
    "chartreuse_yellow":  ("Chartreuse Jaune",      "licors"),
    "benedictine":        ("Bénédictine",           "licors"),
    "galliano":           ("Galliano",              "licors"),
    "suze":               ("Suze",                  "licors"),
    "allspice":           ("AllSpice Dram",         "licors"),

    # Agrumes
    "triple_sec":         ("Triple Sec",            "licors"),
    "curacao":            ("Curaçao",               "licors"),
    "limoncello":         ("Limoncello",            "licors"),

    # Fruits
    "cherry_heering":     ("Cherry Heering",        "licors"),
    "maraschino":         ("Maraschino",            "licors"),
    "apricot_licor":      ("Liqueur Abricot",       "licors"),
    "cassis_licor":       ("Liqueur Cassis",        "licors"),
    "mure_licor":         ("Liqueur Mûre",          "licors"),
    "banana_licor":       ("Liqueur Banane",        "licors"),
    "mint_licor":         ("Liqueur Menthe",        "licors"),
    "chocolate_licor":    ("Liqueur Chocolat",      "licors"),
    "midori":             ("Midori",                "licors"),
    "sloe_gin":           ("Sloe Gin",              "licors"),
    "elderflower_liqueur":("Liqueur de Sureau",     "licors"),

    # Noix / café / crème
    "amaretto":           ("Amaretto",              "licors"),
    "frangelico":         ("Frangelico",            "licors"),
    "coffee_licor":       ("Liqueur de Café",       "licors"),
    "baileys":            ("Baileys",               "licors"),
    "licor_43":           ("Liqueur 43",            "licors"),
    "walnut_licor":       ("Liqueur Noix",          "licors"),

    # Divers
    "sambuca":            ("Sambuca",               "licors"),
    "drambuie":           ("Drambuie",              "licors"),
    "falernum":           ("Falernum",              "licors"),
    "swedish_punsch":     ("Swedish Punsch",        "licors"),

    # ── Modificateurs / vins fortifiés ────────────────────
    "dry_vermouth":       ("Vermouth Dry",          "modifiers"),
    "blanc_vermouth":     ("Vermouth Blanc",        "modifiers"),
    "sweet_vermouth":     ("Vermouth Sweet",        "modifiers"),
    "lillet":             ("Lillet",                "modifiers"),
    "sherry":             ("Xérès / Sherry",        "modifiers"),
    "porto":              ("Porto",                 "modifiers"),
    "sparkling_wine":     ("Vin Pétillant",         "modifiers"),
    "sake":               ("Saké",                  "modifiers"),
    "beer":               ("Bière",                 "modifiers"),
    "red_wine":           ("Vin Rouge",             "modifiers"),
    "rose_wine":          ("Vin Rosé",              "modifiers"),

    # ── Jus ───────────────────────────────────────────────
    "lemon_juice":        ("Jus de citron",         "juices"),
    "lime_juice":         ("Jus de Lime",           "juices"),
    "orange_juice":       ("Jus d'orange",          "juices"),
    "grapefruit_juice":   ("Jus de pamplemousse",   "juices"),
    "pineapple_juice":    ("Jus d'ananas",          "juices"),
    "cranberry_juice":    ("Jus de cranberry",      "juices"),
    "apple_juice":        ("Jus de pomme",          "juices"),
    "tomato_juice":       ("Jus de tomate",         "juices"),

    # ── Sirops ────────────────────────────────────────────
    "simple_syrup":       ("Sirop simple",          "syrups"),
    "semi_simple_syrup":  ("Sirop semi",            "syrups"),
    "rich_simple_syrup":  ("Sirop riche",           "syrups"),
    "honey_syrup":        ("Sirop de miel",         "syrups"),
    "grenadine":          ("Grenadine",             "syrups"),
    "orgeat":             ("Orgeat",                "syrups"),
    "agave_syrup":        ("Sirop d'agave",         "syrups"),
    "cinnamon_syrup":     ("Sirop de cannelle",     "syrups"),
    "passion_fruit_syrup":("Sirop de passion",      "syrups"),
    "raspberry_syrup":    ("Sirop de framboise",    "syrups"),
    "vanilla_syrup":      ("Sirop de vanille",      "syrups"),
    "maple_syrup":        ("Sirop d'érable",        "syrups"),
    "demerara_syrup":     ("Sirop Demerara",        "syrups"),
    "coconut_syrup":      ("Sirop de coco",         "syrups"),

    # ── Bitters ───────────────────────────────────────────
    "angostura_bitters":  ("Angostura Bitters",     "bitters"),
    "peychaud_bitters":   ("Peychaud's Bitters",    "bitters"),
    "orange_bitters":     ("Orange Bitters",        "bitters"),
    "chocolate_bitters":  ("Chocolate Bitters",     "bitters"),
    "celery_bitters":     ("Celery Bitters",        "bitters"),
    "walnut_bitters":     ("Walnut Bitters",        "bitters"),
    "bitters":            ("Bitters",               "bitters"),

    # ── Mixers ────────────────────────────────────────────
    "club_soda":          ("Eau gazeuse",           "mixers"),
    "tonic_water":        ("Tonic",                 "mixers"),
    "ginger_soda":        ("Ginger Beer",           "mixers"),
    "cola":               ("Cola",                  "mixers"),
    "coconut_cream":      ("Crème de coco",         "mixers"),

    # ── Garnish ───────────────────────────────────────────
    "lemon_zest":         ("Zeste Citron",          "garnish"),
    "lime_zest":          ("Zeste Lime",            "garnish"),
    "orange_zest":        ("Zeste Orange",          "garnish"),
    "grapefruit_zest":    ("Zeste Pamplemousse",    "garnish"),
    "lemon_swath":        ("Swath Citron",          "garnish"),
    "lime_swath":         ("Swath Lime",            "garnish"),
    "orange_swath":       ("Swath Orange",          "garnish"),
    "grapefruit_swath":   ("Swath Pamplemousse",    "garnish"),
    "lime_wheel":         ("Rondelle Lime",         "garnish"),
    "cocktail_cherry":    ("Cerise",                "garnish"),
    "olive":              ("Olive",                 "garnish"),
    "nutmeg":             ("Muscade",               "garnish"),
    "mint":               ("Menthe",                "garnish"),
    "cucumber":           ("Concombre",             "garnish"),
    "strawberry":         ("Fraise",                "garnish"),
    "celery":             ("Céleri",                "garnish"),
    "salt":               ("Sel",                   "garnish"),
    "sugar_rim":          ("Sucre (bord)",          "garnish"),
    "dried_fruit":        ("Fruits séchés",         "garnish"),

    # ── Autres ────────────────────────────────────────────
    "aquafaba":           ("Aquafaba",              "others"),
    "egg":                ("Œuf entier",            "others"),
    "heavy_cream":        ("Crème épaisse",         "others"),
    "milk":               ("Lait",                  "others"),
    "butter":             ("Beurre",                "others"),
    "coffee":             ("Café",                  "others"),
    "cold_brew":          ("Cold Brew",             "others"),
    "tea":                ("Thé",                   "others"),
    "matcha":             ("Matcha",                "others"),
    "hot_sauce":          ("Sauce piquante",        "others"),
    "worcestershire":     ("Worcestershire",        "others"),
}


def generate_ingredients():
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Construire les rows à insérer
    rows = []
    for ing_type in sorted(TYPE_METADATA):
        meta = TYPE_METADATA.get(ing_type)
        rows.append({
            "type":      ing_type,
            "name":      meta[0] if meta else ing_type.replace("_", " ").title(),
            "category":  meta[1] if meta else "others",
            "available": False
        })

    print(f"\n📥 Import de {len(rows)} ingrédients dans Supabase...")
    try:
        supabase.table("ingredients").insert(rows).execute()
        print(f"✅ {len(rows)} ingrédients importés avec succès !")
    except Exception as e:
        print(f"❌ Erreur : {e}")

    # Résumé par catégorie
    print("\nRésumé par catégorie :")
    from collections import Counter
    counter = Counter(r["category"] for r in rows)
    for cat, count in sorted(counter.items()):
        print(f"  {cat:12s} : {count} ingrédients")


if __name__ == "__main__":
    generate_ingredients()