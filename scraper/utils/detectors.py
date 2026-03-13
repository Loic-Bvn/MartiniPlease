"""
Fonctions de détection (ingrédients, méthode, etc.)
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from typing import Optional, List, Dict
from unidecode import unidecode

from constants.ingredients_parser import INGREDIENT_RULES
from constants.ingredients_meta import TYPE_METADATA
from config import DASH_ML, OZ_TO_ML

# Dérivés à la volée depuis TYPE_METADATA — une seule source de vérité
# Structure TYPE_METADATA : { type: (name, category, abv, family) }
SPIRIT_TO_FAMILY: dict[str, str] = {
    ing_type: meta[3]
    for ing_type, meta in TYPE_METADATA.items()
    if meta[3] is not None
}

INGREDIENT_ABV: dict[str, float] = {
    ing_type: meta[2]
    for ing_type, meta in TYPE_METADATA.items()
}

GARNISH_TYPES: set[str] = {
    ing_type
    for ing_type, meta in TYPE_METADATA.items()
    if meta[1] == 'garnish'
}

def detect_ingredient_type(ingredient: str) -> str:
    """Détecte le type d'un ingrédient"""
    text = unidecode(ingredient.lower())
    for ing_type, condition in INGREDIENT_RULES:
        if condition(text):
            return ing_type
    return 'garnish'


def find_base_spirit(ingredients: List[Dict]) -> tuple[Optional[str], Optional[str]]:
    """
    Trouve le spiritueux de base et retourne (base_spirit, family).
    base_spirit : clé de type (ex: 'bourbon')
    family      : famille display (ex: 'Whiskey'), stockée dans `category` en base
    """
    for ing in ingredients:
        t = ing.get('Type', '')
        if t in SPIRIT_TO_FAMILY:
            return t, SPIRIT_TO_FAMILY[t]
    return None, None


def calculate_abv(ingredients: List[Dict]) -> Optional[int]:
    """
    Estime l'ABV du cocktail (arrondi au nearest int).
    Utilise ml; fallback oz->ml; compte dashes comme DASH_ML chacun.
    """
    total_alcohol_ml = 0.0
    total_volume_ml = 0.0

    for ing in ingredients:
        ing_type = ing.get('Type', '')
        abv = INGREDIENT_ABV.get(ing_type, 0.0) / 100.0

        if 'Ml' in ing:
            vol_ml = ing['Ml']
        elif 'Oz' in ing:
            vol_ml = ing['Oz'] * OZ_TO_ML
        elif 'Dashes' in ing:
            vol_ml = ing['Dashes'] * DASH_ML
        else:
            continue

        total_volume_ml += vol_ml
        total_alcohol_ml += vol_ml * abv

    if total_volume_ml == 0:
        return None

    return round((total_alcohol_ml / total_volume_ml) * 100)


def detect_method(ingredients: List[Dict]) -> Optional[str]:
    """
    Détecte la méthode de préparation du cocktail

    Retourne:
    - 'shake': Jus, crème, œuf, sirop
    - 'regal_shake': Shake avec un swath de zeste
    - 'stir': Spiritueux + modifiers uniquement
    - 'regal_stir': Stir avec un swath de zeste
    - 'build': Construit directement dans le verre (avec carbonation)
    - 'blend': Fruits frais, glace pilée
    - 'swizzle': Rhum + sirop + crushed ice
    - 'throw': Technique rare de mélange
    """

    spirits = {
        'bourbon', 'rye', 'scotch', 'irish_whiskey', 'peated_whisky', 'whiskey',
        'rum', 'rum_agricol', 'rum_cuban', 'rum_jamaican', 'rum_overproof', 'cachaca',
        'tequila', 'tequila_reposado', 'mezcal',
        'gin', 'gin_dry', 'gin_navy', 'genever',
        'vodka', 'cognac', 'brandy', 'calvados', 'pisco', 'absinthe', 'aquavit', 'grappa'
    }
    juices     = {
        'lemon_juice', 'lime_juice', 'orange_juice', 'grapefruit_juice',
        'pineapple_juice', 'cranberry_juice', 'tomato_juice', 'apple_juice'
    }
    creamy     = {'heavy_cream', 'milk', 'baileys', 'coconut_cream', 'aquafaba', 'egg'}
    syrups     = {
        'simple_syrup', 'honey_syrup', 'agave_syrup', 'grenadine', 'orgeat',
        'cinnamon_syrup', 'vanilla_syrup', 'maple_syrup', 'demerara_syrup',
        'coconut_syrup', 'passion_fruit_syrup', 'raspberry_syrup',
        'rich_simple_syrup', 'semi_simple_syrup'
    }
    carbonated = {'club_soda', 'tonic_water', 'ginger_soda', 'sparkling_wine', 'beer', 'cola'}
    modifiers  = {'dry_vermouth', 'sweet_vermouth', 'blanc_vermouth', 'sherry', 'porto', 'lillet'}
    amari      = {'campari', 'aperol', 'cynar', 'fernet_branca', 'amaro'}
    liqueurs   = {
        'triple_sec', 'curacao', 'maraschino', 'chartreuse_green', 'chartreuse_yellow',
        'benedictine', 'drambuie', 'cointreau'
    }
    citrus_zests = {'lemon_swath', 'lime_swath', 'orange_swath', 'grapefruit_swath'}

    has_juice = has_cream = has_syrup = has_spirit = False
    has_carbonated = has_modifier = has_liqueur = has_amaro = False
    has_fresh_fruit = has_swath = False
    spirit_count = 0

    for ing in ingredients:
        ing_type = ing.get('Type', '')
        ing_name = ing.get('Ingredient', '').lower()

        if ing_type in spirits:       has_spirit = True; spirit_count += 1
        if ing_type in juices:        has_juice = True
        if ing_type in creamy:        has_cream = True
        if ing_type in syrups:        has_syrup = True
        if ing_type in carbonated:    has_carbonated = True
        if ing_type in modifiers:     has_modifier = True
        if ing_type in liqueurs:      has_liqueur = True
        if ing_type in amari:         has_amaro = True
        if ing_type in citrus_zests and 'swath' in ing_name:
            has_swath = True
        if ing_type == 'garnish' and any(
            fruit in ing_name for fruit in ['strawberry', 'strawberries', 'banana', 'mango', 'pineapple chunk']
        ):
            has_fresh_fruit = True

    if has_fresh_fruit or 'frozen' in str([ing.get('Ingredient', '') for ing in ingredients]).lower():
        return 'blend'
    if has_carbonated:
        return 'build'
    if has_cream or has_juice:
        return 'regal_shake' if has_swath else 'shake'
    if (has_syrup or 'aquafaba' in [ing.get('Type') for ing in ingredients]) and has_juice:
        return 'regal_shake' if has_swath else 'shake'

    rum_types = {'rum', 'rum_agricol', 'rum_jamaican', 'rum_overproof'}
    has_rum  = any(ing.get('Type') in rum_types for ing in ingredients)
    has_mint = any('mint' in ing.get('Ingredient', '').lower() for ing in ingredients)
    if has_rum and has_mint and has_syrup and not has_juice:
        return 'swizzle'

    if has_spirit and (has_modifier or has_liqueur or has_amaro) and not has_juice and not has_cream:
        return 'regal_stir' if has_swath else 'stir'

    if has_spirit and has_syrup and not has_juice and not has_cream and not has_carbonated:
        brown_spirits = {'bourbon', 'rye', 'scotch', 'whiskey', 'cognac', 'brandy'}
        if any(ing.get('Type') in brown_spirits for ing in ingredients) and \
           any('bitters' in ing.get('Type', '') for ing in ingredients):
            return 'regal_stir' if has_swath else 'stir'

    return 'regal_shake' if has_swath else 'shake'


def detect_difficulty(cocktail_dict: Dict) -> Optional[str]:
    """
    Détecte la difficulté de la recette
    Retourne: 'easy', 'medium', 'hard', 'expert'
    """
    recipe  = cocktail_dict.get('Recipe', [])
    method  = cocktail_dict.get('Method')

    ingredient_count    = len([ing for ing in recipe if ing.get('Type') != 'garnish'])
    has_advanced_method = method in {'swizzle', 'throw', 'blend'}
    rare_ingredients    = {'absinthe', 'chartreuse_green', 'falernum', 'orgeat', 'aquafaba', 'egg', 'heavy_cream'}
    has_rare            = any(ing.get('Type') in rare_ingredients for ing in recipe)

    if ingredient_count <= 3 and method in ['build', 'stir']:
        return 'easy'
    elif ingredient_count <= 5 and not has_rare and not has_advanced_method:
        return 'medium'
    elif ingredient_count <= 7 or has_rare:
        return 'hard'
    else:
        return 'expert'
    
def detect_profile(ingredients: List[Dict]) -> List[str]:
    """
    Détecte le profil gustatif d'un cocktail basé sur ses ingrédients.
    Retourne une liste de tags parmi :
    - Citrus, Sweet, Bitter, Sour, Smoky, Herbal, Spicy, Fruity,
      Creamy, Boozy, Floral, Tropical, Nutty, Refreshing, Rich, Dry
    """
    types = {ing.get('Type', '') for ing in ingredients}
    profile = set()

    # ── Citrus ────────────────────────────────────
    citrus_juices = {'lemon_juice', 'lime_juice', 'grapefruit_juice', 'orange_juice'}
    if types & citrus_juices:
        profile.add('Citrus')
        profile.add('Sour')

    # ── Sweet ─────────────────────────────────────
    sweet_types = {
        'simple_syrup', 'rich_simple_syrup', 'semi_simple_syrup',
        'honey_syrup', 'agave_syrup', 'demerara_syrup', 'maple_syrup',
        'grenadine', 'orgeat', 'cinnamon_syrup', 'vanilla_syrup',
        'coconut_syrup', 'passion_fruit_syrup', 'raspberry_syrup',
        'guava_syrup', 'ginger_syrup', 'hibiscus_syrup', 'redcurrant_syrup',
        'triple_sec', 'curacao', 'limoncello', 'italicus',
        'cassis_licor', 'mure_licor', 'elderflower_licor', 'violet_licor',
        'apricot_licor', 'banana_licor', 'mango_licor', 'peach_licor',
        'midori', 'pimms', 'pear_licor', 'amaretto', 'frangelico',
        'baileys', 'licor_43', 'chocolate_licor', 'coffee_licor',
        'cherry_heering', 'maraschino', 'sloe_gin',
        'cola', 'pineapple_juice', 'cranberry_juice', 'apple_juice',
        'passion_juice', 'coconut_cream',
    }
    if types & sweet_types:
        profile.add('Sweet')

    # ── Bitter ────────────────────────────────────
    bitter_types = {
        'campari', 'aperol', 'cynar', 'fernet_branca', 'amaro',
        'suze', 'malort', 'angostura_bitters', 'peychaud_bitters',
        'orange_bitters', 'chocolate_bitters', 'celery_bitters',
        'walnut_bitters', 'bitters',
    }
    if types & bitter_types:
        profile.add('Bitter')

    # ── Smoky ─────────────────────────────────────
    smoky_types = {'mezcal', 'peated_whisky', 'scotch'}
    if types & smoky_types:
        profile.add('Smoky')

    # ── Herbal ────────────────────────────────────
    herbal_types = {
        'chartreuse_green', 'chartreuse_yellow', 'benedictine',
        'galliano', 'allspice', 'falernum', 'swedish_punsch',
        'mint_licor', 'sambuca', 'absinthe', 'pastis', 'aquavit', 'genever',
        'suze',
    }
    if types & herbal_types:
        profile.add('Herbal')
    # Menthe fraîche en garnish
    if any('mint' in ing.get('Ingredient', '').lower() for ing in ingredients):
        profile.add('Herbal')
        profile.add('Refreshing')

    # ── Spicy ─────────────────────────────────────
    spicy_types = {'ginger_syrup', 'ginger_soda', 'hot_sauce'}
    if types & spicy_types:
        profile.add('Spicy')
    if any('ginger' in ing.get('Ingredient', '').lower() for ing in ingredients):
        profile.add('Spicy')
    if any('chili' in ing.get('Ingredient', '').lower() or
           'jalapeño' in ing.get('Ingredient', '').lower() or
           'pepper' in ing.get('Ingredient', '').lower()
           for ing in ingredients):
        profile.add('Spicy')

    # ── Fruity ────────────────────────────────────
    fruity_types = {
        'cherry_heering', 'maraschino', 'cassis_licor', 'mure_licor',
        'sloe_gin', 'apricot_licor', 'banana_licor', 'mango_licor',
        'peach_licor', 'midori', 'pear_licor', 'elderflower_licor',
        'pineapple_juice', 'cranberry_juice', 'apple_juice',
        'passion_juice', 'orange_juice', 'grenadine',
        'passion_fruit_syrup', 'raspberry_syrup', 'guava_syrup',
        'hibiscus_syrup', 'redcurrant_syrup',
    }
    if types & fruity_types:
        profile.add('Fruity')

    # ── Tropical ──────────────────────────────────
    tropical_types = {
        'rum', 'rum_agricol', 'rum_cuban', 'rum_jamaican', 'rum_overproof',
        'cachaca', 'coconut_cream', 'coconut_syrup', 'pineapple_juice',
        'passion_juice', 'guava_syrup', 'mango_licor', 'orgeat', 'falernum',
    }
    if types & tropical_types:
        profile.add('Tropical')

    # ── Creamy ────────────────────────────────────
    creamy_types = {'heavy_cream', 'milk', 'baileys', 'coconut_cream', 'aquafaba', 'egg', 'butter'}
    if types & creamy_types:
        profile.add('Creamy')
        profile.add('Rich')

    # ── Nutty ─────────────────────────────────────
    nutty_types = {'amaretto', 'frangelico', 'walnut_licor', 'pit_licor', 'orgeat'}
    if types & nutty_types:
        profile.add('Nutty')

    # ── Floral ────────────────────────────────────
    floral_types = {'elderflower_licor', 'violet_licor', 'italicus', 'lillet', 'cocchi_americano'}
    if types & floral_types:
        profile.add('Floral')
    if any('rose' in ing.get('Ingredient', '').lower() or
           'lavender' in ing.get('Ingredient', '').lower()
           for ing in ingredients):
        profile.add('Floral')

    # ── Rich ──────────────────────────────────────
    rich_types = {
        'cognac', 'brandy', 'calvados', 'bourbon', 'rye', 'sweet_vermouth',
        'porto', 'sherry', 'drambuie', 'chocolate_licor', 'coffee_licor',
        'walnut_licor', 'maple_syrup', 'demerara_syrup', 'honey_syrup',
        'rich_simple_syrup', 'cold_brew', 'coffee', 'stout_beer',
    }
    if types & rich_types:
        profile.add('Rich')

    # ── Dry ───────────────────────────────────────
    dry_types = {
        'dry_vermouth', 'blanc_vermouth', 'sherry', 'sake',
        'sparkling_wine', 'dry_white_wine', 'ipa_beer', 'tonic_water',
    }
    if types & dry_types:
        profile.add('Dry')

    # ── Boozy ─────────────────────────────────────
    # Cocktail fort : peu d'ingrédients non-alcoolisés, ABV estimé élevé
    non_alcoholic = {'juices', 'syrups', 'mixers', 'garnish', 'others'}
    alcoholic_ings = [
        ing for ing in ingredients
        if TYPE_METADATA.get(ing.get('Type', ''), ('', '', 0.0, None))[2] >= 15.0
    ]
    if len(alcoholic_ings) >= 2 and len(ingredients) <= 5:
        profile.add('Boozy')

    # ── Refreshing ────────────────────────────────
    refreshing_types = {'club_soda', 'tonic_water', 'ginger_soda', 'cucumber'}
    if types & refreshing_types:
        profile.add('Refreshing')
    if any('cucumber' in ing.get('Ingredient', '').lower() for ing in ingredients):
        profile.add('Refreshing')

    # ── Priorité et limite à 2 ────────────────────
    PRIORITY = [
        'Smoky', 'Bitter', 'Creamy', 'Tropical', 'Floral',
        'Nutty', 'Spicy', 'Herbal', 'Fruity', 'Citrus',
        'Sour', 'Dry', 'Boozy', 'Refreshing', 'Rich', 'Sweet',
    ]

    ordered = [p for p in PRIORITY if p in profile]
    return ordered[:2]