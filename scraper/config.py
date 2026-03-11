"""
Configuration du scraper de cocktails
"""
import os

# YouTube API
# API_KEY = 'AIzaSyCwl88LgR9ZwUfvQ5ghbSfiGSldDVvy20w'
API_KEY = 'AIzaSyBnYw-E2kSpvhDrHSiTmIr7Ugi-Tk88Whw'

CHANNEL_ID = 'UCEK-PgJHg4Jupi7k7re0qGg'  # Anders Erickson

# Constantes de conversion
DASH_ML = 0.6
OZ_TO_ML = 29.5735

# Saisons disponibles
AVAILABLE_SEASONS = ['autumn', 'winter', 'spring', 'summer']

# ✨ Configuration du cache
CACHE_DIR = os.path.join(os.path.dirname(__file__), 'cache')
CACHE_FILE = os.path.join(CACHE_DIR, 'video_descriptions.json')

# Créer le dossier cache s'il n'existe pas
os.makedirs(CACHE_DIR, exist_ok=True)