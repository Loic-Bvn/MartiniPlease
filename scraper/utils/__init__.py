"""
Utilitaires du scraper
"""
from .parsers import (
    get_season,
    parse_number,
    extract_quantities,
    trim_ingredient_name,
    parse_recipe_blocks
)
from .detectors import (
    detect_ingredient_type,
    find_base_spirit,
    calculate_abv,
    detect_method,
    detect_difficulty
)
from .youtube import YouTubeClient
from .cache import VideoCache  # ✅ Cette ligne

__all__ = [
    'get_season',
    'parse_number',
    'extract_quantities',
    'trim_ingredient_name',
    'parse_recipe_blocks',
    'detect_ingredient_type',
    'find_base_spirit',
    'calculate_abv',
    'detect_method',
    'detect_difficulty',
    'YouTubeClient',
    'VideoCache'  # ✅ Cette ligne
]