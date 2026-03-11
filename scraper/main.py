"""
Point d'entrée du scraper de cocktails
"""
import sys
import os
import argparse

# Ajouter le dossier courant au path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from scraper import CocktailScraper
from config import API_KEY, CHANNEL_ID, AVAILABLE_SEASONS
from utils import VideoCache


def main():
    """Point d'entrée principal"""
    parser = argparse.ArgumentParser(
        description='Scrape cocktail recipes from YouTube channel'
    )
    
    parser.add_argument(
        '--seasons',
        nargs='+',
        choices=AVAILABLE_SEASONS,
        default=AVAILABLE_SEASONS,
        help='Seasons to filter (default: all seasons)'
    )
    
    parser.add_argument(
        '--api-key',
        default=API_KEY,
        help='YouTube API key (default: from config.py)'
    )
    
    parser.add_argument(
        '--channel-id',
        default=CHANNEL_ID,
        help='YouTube channel ID (default: from config.py)'
    )
    
    # ✨ Options de cache
    parser.add_argument(
        '--no-cache',
        action='store_true',
        help='Disable cache and fetch fresh data from YouTube API'
    )
    
    parser.add_argument(
        '--clear-cache',
        action='store_true',
        help='Clear the cache before running'
    )
    
    parser.add_argument(
        '--cache-stats',
        action='store_true',
        help='Show cache statistics and exit'
    )
    
    args = parser.parse_args()
    
    # Afficher les stats du cache
    if args.cache_stats:
        cache = VideoCache()
        stats = cache.get_stats()
        print("📊 Cache Statistics:")
        print(f"  - Total videos cached: {stats['total_videos']}")
        print(f"  - Cache file: {stats['cache_file']}")
        print(f"  - Cache size: {stats['cache_size_mb']} MB")
        return
    
    # Vider le cache
    if args.clear_cache:
        cache = VideoCache()
        cache.clear()
    
    # Créer et lancer le scraper
    use_cache = not args.no_cache
    
    if use_cache:
        print("✅ Cache enabled - Using cached descriptions when available")
    else:
        print("⚠️  Cache disabled - Fetching fresh data from YouTube API")
    
    scraper = CocktailScraper(
        api_key=args.api_key,
        channel_id=args.channel_id,
        use_cache=use_cache
    )
    
    results = scraper.run(seasons_filter=args.seasons)
    
    print(f"\n✨ Successfully scraped {len(results['cocktails'])} cocktails!")


if __name__ == "__main__":
    main()