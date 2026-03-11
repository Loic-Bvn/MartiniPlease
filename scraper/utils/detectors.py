"""
Fonctions de détection (ingrédients, méthode, etc.)
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from typing import Optional, List, Dict
from unidecode import unidecode

from constants.ingredients import INGREDIENT_RULES
from constants.spirits import SPIRIT_TO_CATEGORY
from constants.abv import INGREDIENT_ABV
from config import DASH_ML, OZ_TO_ML

def detect_ingredient_type(ingredient: str) -> str:
    """Détecte le type d'un ingrédient"""
    text = unidecode(ingredient.lower())
    for ing_type, condition in INGREDIENT_RULES:
        if condition(text):
            return ing_type
    return 'garnish'


def find_base_spirit(ingredients: List[Dict]) -> tuple[Optional[str], Optional[str]]:
    """Trouve le spiritueux de base et sa catégorie"""
    for ing in ingredients:
        t = ing.get('Type', '')
        if t in SPIRIT_TO_CATEGORY:
            return t, SPIRIT_TO_CATEGORY[t]
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
    - 'shake': Jus, crème, œuf, sirop (nécessite émulsion/dilution rapide)
    - 'regal_shake': Shake avec un swath de zeste (expression des huiles)
    - 'stir': Spiritueux + modifiers uniquement (préserve clarté)
    - 'regal_stir': Stir avec un swath de zeste (expression des huiles)
    - 'build': Construit directement dans le verre (avec carbonation)
    - 'blend': Fruits frais, glace pilée
    - 'swizzle': Rhum + sirop + crushed ice (traditionnel)
    - 'throw': Technique rare de mélange (2 verres)
    """
    
    # ── Catégorisation des ingrédients ──
    spirits = {
        'bourbon', 'rye', 'scotch', 'irish_whiskey', 'peated_whisky', 'whiskey',
        'rum', 'rum_agricol', 'rum_cuban', 'rum_jamaican', 'rum_overproof', 'cachaca',
        'tequila', 'tequila_reposado', 'mezcal',
        'gin', 'gin_dry', 'gin_navy', 'genever',
        'vodka', 'cognac', 'brandy', 'calvados', 'pisco', 'absinthe', 'aquavit', 'grappa'
    }
    
    juices = {
        'lemon_juice', 'lime_juice', 'orange_juice', 'grapefruit_juice',
        'pineapple_juice', 'cranberry_juice', 'tomato_juice', 'apple_juice'
    }
    
    creamy = {
        'heavy_cream', 'milk', 'baileys', 'coconut_cream', 'aquafaba', 'egg'
    }
    
    syrups = {
        'simple_syrup', 'honey_syrup', 'agave_syrup', 'grenadine', 'orgeat',
        'cinnamon_syrup', 'vanilla_syrup', 'maple_syrup', 'demerara_syrup',
        'coconut_syrup', 'passion_fruit_syrup', 'raspberry_syrup',
        'rich_simple_syrup', 'semi_simple_syrup'
    }
    
    carbonated = {
        'club_soda', 'tonic_water', 'ginger_soda', 'sparkling_wine', 'beer', 'cola'
    }
    
    modifiers = {
        'dry_vermouth', 'sweet_vermouth', 'blanc_vermouth',
        'sherry', 'porto', 'lillet'
    }
    
    amari = {
        'campari', 'aperol', 'cynar', 'fernet_branca', 'amaro'
    }
    
    liqueurs = {
        'triple_sec', 'curacao', 'maraschino', 'chartreuse_green', 'chartreuse_yellow',
        'benedictine', 'drambuie', 'cointreau'
    }
    
    # Zestes pour regal
    citrus_zests = {
        'lemon_swath', 'lime_swath', 'orange_swath', 'grapefruit_swath'
    }
    
    # ── Flags de détection ──
    has_juice = False
    has_cream = False
    has_syrup = False
    has_spirit = False
    has_carbonated = False
    has_modifier = False
    has_liqueur = False
    has_amaro = False
    has_fresh_fruit = False
    has_swath = False  # ✨ Nouveau flag
    spirit_count = 0
    
    # ── Analyse des ingrédients ──
    for ing in ingredients:
        ing_type = ing.get('Type', '')
        ing_name = ing.get('Ingredient', '').lower()
        
        if ing_type in spirits:
            has_spirit = True
            spirit_count += 1
        
        if ing_type in juices:
            has_juice = True
        
        if ing_type in creamy:
            has_cream = True
        
        if ing_type in syrups:
            has_syrup = True
        
        if ing_type in carbonated:
            has_carbonated = True
        
        if ing_type in modifiers:
            has_modifier = True
        
        if ing_type in liqueurs:
            has_liqueur = True
        
        if ing_type in amari:
            has_amaro = True
        
        # ✨ Détection du swath
        if ing_type in citrus_zests and 'swath' in ing_name:
            has_swath = True
        
        # Détection fruits frais (pour blend)
        if ing_type == 'garnish' and any(fruit in ing_name for fruit in 
            ['strawberry', 'strawberries', 'banana', 'mango', 'pineapple chunk']):
            has_fresh_fruit = True
    
    # ── Logique de détection (ordre d'importance) ──
    
    # 1. BLEND : Fruits frais (Piña Colada, Frozen Daiquiri, Smoothie)
    if has_fresh_fruit or 'frozen' in str([ing.get('Ingredient', '') for ing in ingredients]).lower():
        return 'blend'
    
    # 2. BUILD : Carbonated drinks (Mojito, G&T, Highball, Spritz)
    if has_carbonated:
        return 'build'
    
    # 3. SHAKE / REGAL SHAKE : Jus OU crème OU œuf OU sirop
    if has_cream or has_juice:
        if has_swath:
            return 'regal_shake'  # ✨ Regal shake
        return 'shake'
    
    if (has_syrup or 'aquafaba' in [ing.get('Type') for ing in ingredients]) and has_juice:
        if has_swath:
            return 'regal_shake'  # ✨ Regal shake
        return 'shake'
    
    # 4. SWIZZLE : Rhum + sirop + glace pilée (Queens Park Swizzle)
    rum_types = {'rum', 'rum_agricol', 'rum_jamaican', 'rum_overproof'}
    has_rum = any(ing.get('Type') in rum_types for ing in ingredients)
    has_mint = any('mint' in ing.get('Ingredient', '').lower() for ing in ingredients)
    
    if has_rum and has_mint and has_syrup and not has_juice:
        return 'swizzle'
    
    # 5. STIR / REGAL STIR : Spiritueux + modifiers/liqueurs
    if has_spirit and (has_modifier or has_liqueur or has_amaro) and not has_juice and not has_cream:
        if has_swath:
            return 'regal_stir'  # ✨ Regal stir
        return 'stir'
    
    # 6. STIR / REGAL STIR : Spirit-forward avec sirop (Old Fashioned, Sazerac)
    if has_spirit and has_syrup and not has_juice and not has_cream and not has_carbonated:
        brown_spirits = {'bourbon', 'rye', 'scotch', 'whiskey', 'cognac', 'brandy'}
        has_brown = any(ing.get('Type') in brown_spirits for ing in ingredients)
        has_bitters = any('bitters' in ing.get('Type', '') for ing in ingredients)
        
        if has_brown and has_bitters:
            if has_swath:
                return 'regal_stir'  # ✨ Regal stir
            return 'stir'
    
    # 7. DÉFAUT : Shake (la méthode la plus sûre pour l'inconnu)
    if has_swath:
        return 'regal_shake'  # ✨ Par défaut avec swath
    return 'shake'

def detect_difficulty(cocktail_dict: Dict) -> Optional[str]:
    """
    Détecte la difficulté de la recette
    Retourne: 'easy', 'medium', 'hard', 'expert'
    """
    recipe = cocktail_dict.get('Recipe', [])
    method = cocktail_dict.get('Method')
    
    ingredient_count = len([ing for ing in recipe if ing.get('Type') != 'garnish'])
    
    # Techniques avancées
    advanced_methods = {'swizzle', 'throw', 'blend'}
    has_advanced_method = method in advanced_methods
    
    # Ingrédients rares/difficiles
    rare_ingredients = {
        'absinthe', 'chartreuse_green', 'falernum', 'orgeat', 
        'aquafaba', 'egg', 'heavy_cream'
    }
    has_rare = any(ing.get('Type') in rare_ingredients for ing in recipe)
    
    # Logique
    if ingredient_count <= 3 and method in ['build', 'stir']:
        return 'easy'
    elif ingredient_count <= 5 and not has_rare and not has_advanced_method:
        return 'medium'
    elif ingredient_count <= 7 or has_rare:
        return 'hard'
    else:
        return 'expert'
    
