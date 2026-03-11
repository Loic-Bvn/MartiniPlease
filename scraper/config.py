"""
Configuration du scraper de cocktails
Les variables sensibles sont lues depuis les variables d'environnement.
Copier .env.example -> .env et remplir les valeurs.
"""
import os

# YouTube API
API_KEY    = os.environ.get("YOUTUBE_API_KEY", "")
CHANNEL_ID = os.environ.get("YOUTUBE_CHANNEL_ID", "UCEK-PgJHg4Jupi7k7re0qGg")  # Anders Erickson

# Supabase
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

# Constantes de conversion
DASH_ML  = 0.6
OZ_TO_ML = 29.5735

# Saisons disponibles
AVAILABLE_SEASONS = ['autumn', 'winter', 'spring', 'summer']

# Configuration du cache
CACHE_DIR  = os.path.join(os.path.dirname(__file__), 'cache')
CACHE_FILE = os.path.join(CACHE_DIR, 'video_descriptions.json')

# Créer le dossier cache s'il n'existe pas
os.makedirs(CACHE_DIR, exist_ok=True)
