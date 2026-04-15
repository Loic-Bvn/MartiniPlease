"""
Métadonnées des ingrédients : nom affiché, catégorie, ABV, famille.
Source de vérité unique, importée par :
  - scraper/supabase/ingredients.py  (génération de la table Supabase)
  - scraper/utils/detectors.py       (find_base_spirit, calculate_abv)

Structure du tuple : (nom affiché, catégorie, abv, famille)
  - abv    = 0.0  pour les ingrédients non-alcoolisés
  - family = None pour les ingrédients sans famille pertinente
"""

TYPE_METADATA = {
    # Spiritueux          name                      category      abv    family
    "bourbon":            ("Bourbon",               "spirits",    40.0,  "Whiskey"),
    "rye":                ("Rye Whiskey",           "spirits",    40.0,  "Whiskey"),
    "scotch":             ("Scotch Whisky",         "spirits",    40.0,  "Whiskey"),
    "irish_whiskey":      ("Irish Whiskey",         "spirits",    40.0,  "Whiskey"),
    "peated_whisky":      ("Islay Scotch",          "spirits",    43.0,  "Whiskey"),
    "whiskey":            ("Whiskey",               "spirits",    40.0,  "Whiskey"),
    "rum":                ("Rum",                   "spirits",    40.0,  "Rum"),
    "rum_agricol":        ("Rhum Agricole",         "spirits",    50.0,  "Rum"),
    "rum_cuban":          ("Rhum Cubain",           "spirits",    40.0,  "Rum"),
    "rum_jamaican":       ("Rhum Jamaicain",        "spirits",    40.0,  "Rum"),
    "rum_overproof":      ("Overproof Rhum",        "spirits",    63.0,  "Rum"),
    "cachaca":            ("Cachaça",               "spirits",    40.0,  "Rum"),
    "tequila":            ("Tequila",               "spirits",    40.0,  "Agave"),
    "tequila_reposado":   ("Tequila Reposado",      "spirits",    40.0,  "Agave"),
    "mezcal":             ("Mezcal",                "spirits",    42.0,  "Agave"),
    "gin":                ("Gin",                   "spirits",    40.0,  "Gin"),
    "gin_dry":            ("Dry Gin",               "spirits",    40.0,  "Gin"),
    "gin_navy":           ("Navy Strength Gin",     "spirits",    57.0,  "Gin"),
    "genever":            ("Genièvre",              "spirits",    35.0,  "Gin"),
    "vodka":              ("Vodka",                 "spirits",    40.0,  "Vodka"),
    "cognac":             ("Cognac",                "spirits",    40.0,  "Brandy"),
    "brandy":             ("Brandy",                "spirits",    40.0,  "Brandy"),
    "calvados":           ("Calvados",              "spirits",    40.0,  "Brandy"),
    "pisco":              ("Pisco",                 "spirits",    40.0,  "Brandy"),
    "grappa":             ("Grappa",                "spirits",    42.0,  "Brandy"),
    "absinthe":           ("Absinthe",              "spirits",    65.0,  "Absinthe"),
    "aquavit":            ("Aquavit",               "spirits",    40.0,  "Aquavit"),
    "pastis":             ("Pastis",                "spirits",    45.0,  "Pastis"),

    # ── Liqueurs amères ────────────────────────────
    "aperol":             ("Aperol",                "licors",     11.0,  "Liqueur Amer"),
    "campari":            ("Campari",               "licors",     24.0,  "Liqueur Amer"),
    "cynar":              ("Cynar",                 "licors",     16.5,  "Liqueur Amer"),
    "fernet_branca":      ("Fernet Branca",         "licors",     39.0,  "Liqueur Amer"),
    "amaro":              ("Amaro",                 "licors",     30.0,  "Liqueur Amer"),
    "suze":               ("Suze",                  "licors",     20.0,  "Liqueur Amer"),
    "malort":             ("Malört",                "licors",     35.0,  "Liqueur Amer"),

    # ── Liqueurs herbes / plantes ──────────────────
    "chartreuse_green":   ("Chartreuse Verte",      "licors",     55.0,  "Liqueur Herbes"),
    "chartreuse_yellow":  ("Chartreuse Jaune",      "licors",     40.0,  "Liqueur Herbes"),
    "benedictine":        ("Bénédictine",           "licors",     40.0,  "Liqueur Herbes"),
    "galliano":           ("Galliano",              "licors",     42.3,  "Liqueur Herbes"),
    "allspice":           ("AllSpice Dram",         "licors",     22.0,  "Liqueur Herbes"),
    "falernum":           ("Falernum",              "licors",     11.0,  "Liqueur Herbes"),
    "swedish_punsch":     ("Swedish Punsch",        "licors",     26.0,  "Liqueur Herbes"),
    "mint_licor":         ("Liqueur Menthe",        "licors",     25.0,  "Liqueur Herbes"),
    "sambuca":            ("Sambuca",               "licors",     38.0,  "Liqueur Herbes"),

    # ── Liqueurs agrumes ───────────────────────────
    "triple_sec":         ("Triple Sec",            "licors",     40.0,  "Liqueur Agrume"),
    "curacao":            ("Curaçao",               "licors",     40.0,  "Liqueur Agrume"),
    "limoncello":         ("Limoncello",            "licors",     26.0,  "Liqueur Agrume"),
    "italicus":           ("Italicus",              "licors",     20.0,  "Liqueur Agrume"),

    # ── Liqueurs fruits ────────────────────────────
    "cherry_heering":     ("Cherry Heering",        "licors",     24.0,  "Liqueur Fruits"),
    "maraschino":         ("Maraschino",            "licors",     32.0,  "Liqueur Fruits"),
    "cassis_licor":       ("Liqueur Cassis",        "licors",     16.0,  "Liqueur Fruits"),
    "mure_licor":         ("Liqueur Mûre",          "licors",     18.0,  "Liqueur Fruits"),
    "sloe_gin":           ("Sloe Gin",              "licors",     26.0,  "Liqueur Fruits"),
    "elderflower_licor":  ("Liqueur de Sureau",     "licors",     20.0,  "Liqueur Fruits"),
    "violet_licor":       ("Liqueur de Violette",   "licors",     20.0,  "Liqueur Fruits"),
    "apricot_licor":      ("Liqueur Abricot",       "licors",     25.0,  "Liqueur Fruits"),
    "banana_licor":       ("Liqueur Banane",        "licors",     20.0,  "Liqueur Fruits"),
    "mango_licor":        ("Liqueur Mangue",        "licors",     20.0,  "Liqueur Fruits"),
    "peach_licor":        ("Liqueur Pêche",         "licors",     18.0,  "Liqueur Fruits"),
    "midori":             ("Midori",                "licors",     20.0,  "Liqueur Fruits"),
    "pimms":              ("Pimm's",                "licors",     25.0,  "Liqueur Fruits"),
    "pear_licor":         ("Liqueur de Poire",      "licors",     20.0,  "Liqueur Fruits"),

    # ── Liqueurs noix / noyaux ─────────────────────
    "amaretto":           ("Amaretto",              "licors",     21.0,  "Liqueur Noix"),
    "frangelico":         ("Frangelico",            "licors",     20.0,  "Liqueur Noix"),
    "walnut_licor":       ("Liqueur Noix",          "licors",     30.0,  "Liqueur Noix"),
    "pit_licor":          ("Liqueur de Noyaux",     "licors",     25.0,  "Liqueur Noix"),

    # ── Liqueurs café / crème ──────────────────────
    "coffee_licor":       ("Liqueur de Café",       "licors",     20.0,  "Liqueur Dessert"),
    "baileys":            ("Baileys",               "licors",     17.0,  "Liqueur Dessert"),
    "licor_43":           ("Liqueur 43",            "licors",     31.0,  "Liqueur Dessert"),
    "chocolate_licor":    ("Liqueur Chocolat",      "licors",     20.0,  "Liqueur Dessert"),
    "drambuie":           ("Drambuie",              "licors",     40.0,  "Liqueur Dessert"),

    # ── Modificateurs / vins fortifiés ────────────
    "dry_vermouth":       ("Vermouth Dry",          "modifiers",  18.0,  "Vermouth"),
    "blanc_vermouth":     ("Vermouth Blanc",        "modifiers",  18.0,  "Vermouth"),
    "sweet_vermouth":     ("Vermouth Sweet",        "modifiers",  16.0,  "Vermouth"),
    "lillet":             ("Lillet",                "modifiers",  17.0,  "Vin Aromatisé"),
    "cocchi_americano":   ("Cocchi Americano",      "modifiers",  16.5,  "Vin Aromatisé"),
    "sherry":             ("Xérès / Sherry",        "modifiers",  17.0,  "Vin Fortifié"),
    "porto":              ("Porto",                 "modifiers",  20.0,  "Vin Fortifié"),
    "sparkling_wine":     ("Vin Pétillant",         "modifiers",  12.0,  "Vin Pétillant"),
    "sake":               ("Saké",                  "modifiers",  15.0,  "Saké"),
    "beer":               ("Bière",                 "modifiers",   5.0,  "Bière"),
    "ipa_beer":           ("Bière IPA",             "modifiers",   6.5,  "Bière"),
    "stout_beer":         ("Stout",                 "modifiers",   5.0,  "Bière"),
    "red_wine":           ("Vin Rouge",             "modifiers",  13.0,  "Vin"),
    "dry_white_wine":     ("Vin Blanc Sec",         "modifiers",  12.5,  "Vin"),
    "sweet_white_wine":   ("Vin Blanc Doux",        "modifiers",  11.0,  "Vin"),
    "rose_wine":          ("Vin Rosé",              "modifiers",  12.0,  "Vin"),

    # ── Jus ───────────────────────────────────────
    "lemon_juice":        ("Jus de citron",         "juices",      0.0,  None),
    "lime_juice":         ("Jus de Lime",           "juices",      0.0,  None),
    "orange_juice":       ("Jus d'orange",          "juices",      0.0,  None),
    "grapefruit_juice":   ("Jus de pamplemousse",   "juices",      0.0,  None),
    "pineapple_juice":    ("Jus d'ananas",          "juices",      0.0,  None),
    "cranberry_juice":    ("Jus de cranberry",      "juices",      0.0,  None),
    "apple_juice":        ("Jus de pomme",          "juices",      0.0,  None),
    "passion_juice":      ("Jus de passion",        "juices",      0.0,  None),
    "tomato_juice":       ("Jus de tomate",         "juices",      0.0,  None),

    # ── Sirops ────────────────────────────────────
    "simple_syrup":       ("Sirop simple",          "syrups",      0.0,  None),
    "semi_simple_syrup":  ("Sirop semi",            "syrups",      0.0,  None),
    "rich_simple_syrup":  ("Sirop riche",           "syrups",      0.0,  None),
    "honey_syrup":        ("Sirop de miel",         "syrups",      0.0,  None),
    "grenadine":          ("Grenadine",             "syrups",      0.0,  None),
    "orgeat":             ("Orgeat",                "syrups",      0.0,  None),
    "agave_syrup":        ("Sirop d'agave",         "syrups",      0.0,  None),
    "cinnamon_syrup":     ("Sirop de cannelle",     "syrups",      0.0,  None),
    "passion_fruit_syrup":("Sirop de passion",      "syrups",      0.0,  None),
    "raspberry_syrup":    ("Sirop de framboise",    "syrups",      0.0,  None),
    "vanilla_syrup":      ("Sirop de vanille",      "syrups",      0.0,  None),
    "maple_syrup":        ("Sirop d'érable",        "syrups",      0.0,  None),
    "demerara_syrup":     ("Sirop Demerara",        "syrups",      0.0,  None),
    "coconut_syrup":      ("Sirop de coco",         "syrups",      0.0,  None),
    "guava_syrup":        ("Sirop de Goyave",       "syrups",      0.0,  None),
    "ginger_syrup":       ("Sirop de Gingembre",    "syrups",      0.0,  None),
    "hibiscus_syrup":     ("Sirop d'Hibiscus",      "syrups",      0.0,  None),
    "redcurrant_syrup":   ("Sirop de Groseille",    "syrups",      0.0,  None),

    # ── Bitters ───────────────────────────────────
    "angostura_bitters":  ("Angostura Bitters",     "bitters",    44.7,  "Bitters"),
    "peychaud_bitters":   ("Peychaud's Bitters",    "bitters",    35.0,  "Bitters"),
    "orange_bitters":     ("Orange Bitters",        "bitters",    28.0,  "Bitters"),
    "chocolate_bitters":  ("Chocolate Bitters",     "bitters",    40.0,  "Bitters"),
    "celery_bitters":     ("Celery Bitters",        "bitters",    40.0,  "Bitters"),
    "walnut_bitters":     ("Walnut Bitters",        "bitters",    40.0,  "Bitters"),
    "bitters":            ("Bitters",               "bitters",    40.0,  "Bitters"),

    # ── Mixers ────────────────────────────────────
    "club_soda":          ("Eau gazeuse",           "mixers",      0.0,  None),
    "tonic_water":        ("Tonic",                 "mixers",      0.0,  None),
    "ginger_soda":        ("Ginger Beer",           "mixers",      0.0,  None),
    "cola":               ("Cola",                  "mixers",      0.0,  None),
    "coconut_cream":      ("Crème de coco",         "mixers",      0.0,  None),

    # ── Garnish ───────────────────────────────────
    "lemon_zest":         ("Zeste Citron",          "garnish",     0.0,  None),
    "lime_zest":          ("Zeste Lime",            "garnish",     0.0,  None),
    "orange_zest":        ("Zeste Orange",          "garnish",     0.0,  None),
    "grapefruit_zest":    ("Zeste Pamplemousse",    "garnish",     0.0,  None),
    "lemon_swath":        ("Swath Citron",          "garnish",     0.0,  None),
    "lime_swath":         ("Swath Lime",            "garnish",     0.0,  None),
    "orange_swath":       ("Swath Orange",          "garnish",     0.0,  None),
    "grapefruit_swath":   ("Swath Pamplemousse",    "garnish",     0.0,  None),
    "lime_wheel":         ("Rondelle Lime",         "garnish",     0.0,  None),
    "cocktail_cherry":    ("Cerise",                "garnish",     0.0,  None),
    "olive":              ("Olive",                 "garnish",     0.0,  None),
    "nutmeg":             ("Muscade",               "garnish",     0.0,  None),
    "mint":               ("Menthe",                "garnish",     0.0,  None),
    "cucumber":           ("Concombre",             "garnish",     0.0,  None),
    "strawberry":         ("Fraise",                "garnish",     0.0,  None),
    "celery":             ("Céleri",                "garnish",     0.0,  None),
    "salt":               ("Sel",                   "garnish",     0.0,  None),
    "sugar_rim":          ("Sucre (bord)",          "garnish",     0.0,  None),
    "dried_fruit":        ("Fruits séchés",         "garnish",     0.0,  None),
    "cinnamon_stick":     ("Bâton de cannelle",     "garnish",     0.0,  None),
    "grape":              ("Raisin",                "garnish",     0.0,  None),
    "orange_wheel":       ("Rondelle Orange",       "garnish",     0.0,  None),
    "lemon_wheel":        ("Rondelle Citron",       "garnish",     0.0,  None),
    "pineapple":          ("Ananas",                "garnish",     0.0,  None),
    "pineapple_fronds":   ("Feuilles Ananas",       "garnish",     0.0,  None),
    
    # ── Autres ────────────────────────────────────
    "aquafaba":           ("Aquafaba",              "others",      0.0,  None),
    "egg":                ("Œuf entier",            "others",      0.0,  None),
    "heavy_cream":        ("Crème épaisse",         "others",      0.0,  None),
    "milk":               ("Lait",                  "others",      0.0,  None),
    "butter":             ("Beurre",                "others",      0.0,  None),
    "coffee":             ("Café",                  "others",      0.0,  None),
    "cold_brew":          ("Cold Brew",             "others",      0.0,  None),
    "tea":                ("Thé",                   "others",      0.0,  None),
    "matcha":             ("Matcha",                "others",      0.0,  None),
    "hot_sauce":          ("Sauce piquante",        "others",      0.0,  None),
    "worcestershire":     ("Worcestershire",        "others",      0.0,  None),
    "water":              ("Eau",                   "others",      0.0,  None),
    "hot_water":          ("Eau chaude",            "others",      0.0,  None),
}