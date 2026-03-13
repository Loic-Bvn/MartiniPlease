"""
Fonctions de parsing pour extraire les données
"""
import re
from typing import Optional, Dict, List
from datetime import datetime


def get_season(dt: datetime) -> str:
    """Détermine la saison basée sur la date"""
    m, d = dt.month, dt.day
    if (m == 12 and d >= 21) or m in [1, 2] or (m == 3 and d < 20):
        return 'winter'
    elif (m == 3 and d >= 20) or m in [4, 5] or (m == 6 and d < 21):
        return 'spring'
    elif (m == 6 and d >= 21) or m in [7, 8] or (m == 9 and d < 23):
        return 'summer'
    return 'autumn'


def parse_number(s: str) -> Optional[float]:
    """Convertit une string comme '3/4' ou '1.5' en float"""
    s = s.strip()
    try:
        if '/' in s:
            num, denom = s.split('/', 1)
            return float(num) / float(denom)
        return float(s)
    except (ValueError, ZeroDivisionError):
        return None


def extract_quantities(ingredient: str) -> Dict:
    """Extrait les quantités (oz, ml, dashes) d'une ligne d'ingrédient"""
    oz_match = re.search(r'([\d./]+)\s*oz', ingredient)
    ml_match = re.search(r'\(([\d.]+)\s*ml\)', ingredient)
    dash_match = re.search(r'(\d+)\s*dash', ingredient, re.IGNORECASE)

    result = {}
    if oz_match:
        val = parse_number(oz_match.group(1))
        if val is not None:
            result['Oz'] = val
    if ml_match:
        val = parse_number(ml_match.group(1))
        if val is not None:
            result['Ml'] = val
    if dash_match:
        result['Dashes'] = int(dash_match.group(1))
    return result


def trim_ingredient_name(ingredient: str) -> str:
    """Nettoie le nom de l'ingrédient"""
    pos = ingredient.find(")")
    return ingredient[pos + 2:].strip() if pos != -1 else ingredient.strip()

def clean_cocktail_name(name: str) -> str:
    """
    Nettoie le nom d'un cocktail :
    - Supprime les numéros de liste en début (ex: "1. ", "12. ")
    - Supprime les "The/THE/the" en début de nom
    - Supprime les chiffres isolés en début ou fin
    - Supprime les caractères spéciaux non pertinents (*, #, emojis...)
    - Met en title case
    - Normalise les espaces
    """
    # Supprimer les emojis et symboles non-ASCII parasites
    name = re.sub(r"[^\x00-\x7Féàèùâêîôûäëïöüç''\-& ]", '', name)

    # Supprimer les caractères spéciaux de début (*, #, -, etc.)
    name = re.sub(r'^[\*#\-–—•]+\s*', '', name)

    #   Supprimer les numéros de liste en début (ex: "1. ", "12) ", "3 - ")
    name = re.sub(r'^\d+[\.\)]\s*', '', name)

    # Supprimer "The" / "THE" / "the" en début de nom
    name = re.sub(r'(?i)^the\s+', '', name)

    # Supprimer "Cocktail"
    name = re.sub(r'(?i)\bcocktail\b\s*', '', name)

    # Supprimer les chiffres isolés en début ou fin de nom
    name = re.sub(r'^\d+\s+', '', name)
    name = re.sub(r'\s+\d+$', '', name)

    # Normaliser les espaces multiples
    name = re.sub(r'\s+', ' ', name).strip()

    #   Title case (ex: "WHISKEY SMASH" → "Whiskey Smash")
    name = name.title()

    return name

def parse_recipe_blocks(text: str) -> List[List[str]]:
    """Extrait les blocs de recettes d'une description de vidéo"""
    lines = text.split('\n')
    blocks, block, capturing = [], [], False

    for line in lines:
        if "RECIPE" in line:
            if block:
                blocks.append(block)
            block, capturing = [line], True
        elif capturing:
            if line.strip() == "":
                capturing = False
            else:
                block.append(line)

    if block:
        blocks.append(block)
    return blocks