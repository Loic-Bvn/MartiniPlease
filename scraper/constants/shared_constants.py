"""
Adapter pour charger les constantes depuis le fichier JSON centralisé.
Permet au scraper d'accéder aux mêmes données que le frontend Vue.

Usage:
    from scraper.constants.shared_constants import INGREDIENTS_METADATA, GLASSES, METHODS, etc.
"""

import json
import os
from typing import Dict, Any, Optional, Tuple

# Chemin vers le fichier de constantes centralisées
CONSTANTS_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    'src',
    'constants',
    'cocktail-constants.json'
)

# Cache les données chargées
_CONSTANTS_CACHE: Optional[Dict[str, Any]] = None

def _load_constants() -> Dict[str, Any]:
    """
    Charge les constantes depuis le fichier JSON central.
    Utilise un cache pour améliorer les performances.
    
    Returns:
        Dict avec toutes les constantes
        
    Raises:
        FileNotFoundError: Si le fichier de constantes n'existe pas
        json.JSONDecodeError: Si le JSON est malformé
    """
    global _CONSTANTS_CACHE
    
    if _CONSTANTS_CACHE is not None:
        return _CONSTANTS_CACHE
    
    if not os.path.exists(CONSTANTS_PATH):
        raise FileNotFoundError(f"❌ Fichier de constantes non trovuvé: {CONSTANTS_PATH}")
    
    try:
        with open(CONSTANTS_PATH, 'r', encoding='utf-8') as f:
            _CONSTANTS_CACHE = json.load(f)
        print(f"✅ Constantes chargées depuis {CONSTANTS_PATH}")
        return _CONSTANTS_CACHE
    except json.JSONDecodeError as e:
        raise json.JSONDecodeError(f"❌ Erreur JSON dans {CONSTANTS_PATH}: {e.msg}", e.doc, e.pos)


def get_ingredient_metadata(ingredient_type: str) -> Optional[Tuple[str, str, float, Optional[str]]]:
    """
    Récupère les métadonnées d'un ingrédient (name, category, abv, family).
    
    Args:
        ingredient_type: Clé de l'ingrédient (ex: 'bourbon')
        
    Returns:
        Tuple (name, category, abv, family) ou None si non trouvé
    """
    constants = _load_constants()
    ingredients = constants.get('ingredients', {})
    
    # Chercher dans toutes les catégories
    for category_dict in ingredients.values():
        if isinstance(category_dict, dict) and ingredient_type in category_dict:
            ing = category_dict[ingredient_type]
            return (
                ing['name'],
                ing['category'],
                ing['abv'],
                ing['family']
            )
    
    return None


def get_all_ingredients_dict() -> Dict[str, Tuple[str, str, float, Optional[str]]]:
    """
    Retourne TOUS les ingrédients en format compatibel avec l'ancien TYPE_METADATA.
    Format: {key: (name, category, abv, family)}
    """
    constants = _load_constants()
    result = {}
    
    ingredients = constants.get('ingredients', {})
    for category_dict in ingredients.values():
        if isinstance(category_dict, dict):
            for key, ing in category_dict.items():
                result[key] = (
                    ing['name'],
                    ing['category'],
                    ing['abv'],
                    ing['family']
                )
    
    return result


def get_glasses() -> Dict[str, Dict[str, str]]:
    """Récupère les types de verres."""
    constants = _load_constants()
    return constants.get('glasses', {})


def get_methods() -> Dict[str, Dict[str, str]]:
    """Récupère les méthodes de préparation."""
    constants = _load_constants()
    return constants.get('methods', {})


def get_ice_types() -> Dict[str, Dict[str, str]]:
    """Récupère les types de glaçons."""
    constants = _load_constants()
    return constants.get('ice_types', {})


def get_profiles() -> Dict[str, Dict[str, str]]:
    """Récupère les profils de goût."""
    constants = _load_constants()
    return constants.get('profiles', {})


def get_seasons() -> Dict[str, Dict[str, str]]:
    """Récupère les saisons."""
    constants = _load_constants()
    return constants.get('seasons', {})


def get_cocktail_styles() -> list:
    """Récupère les styles de cocktail."""
    constants = _load_constants()
    return constants.get('cocktail_styles', [])


def get_difficulties() -> Dict[str, Dict[str, Any]]:
    """Récupère les niveaux de difficulté."""
    constants = _load_constants()
    return constants.get('difficulties', {})


# 🔄 Créer l'équivalent de TYPE_METADATA pour rétro-compatibilité
def get_type_metadata() -> Dict[str, Tuple[str, str, float, Optional[str]]]:
    """
    Retourne TYPE_METADATA au format original (tuple).
    À utiliser pour remplacer : from ingredients_meta import TYPE_METADATA
    """
    return get_all_ingredients_dict()


# Chargement au démarrage du module
if __name__ == "__main__":
    # Test les constantes
    constants = _load_constants()
    print(f"\n📌 Constantes chargées avec succès!")
    print(f"   - {len(get_all_ingredients_dict())} ingrédients")
    print(f"   - {len(get_glasses())} verres")
    print(f"   - {len(get_methods())} méthodes")
    print(f"   - {len(get_ice_types())} types de glaçons")
    print(f"   - {len(get_profiles())} profils")
    print(f"   - {len(get_seasons())} saisons")
    print(f"   - {len(get_cocktail_styles())} styles")
