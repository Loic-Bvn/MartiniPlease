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