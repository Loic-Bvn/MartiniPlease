"""
Gestion du cache des descriptions de vidéos YouTube
"""
import json
import os
from typing import Dict, Optional, List
from datetime import datetime

from config import CACHE_FILE


class VideoCache:
    """Gestionnaire de cache pour les descriptions de vidéos"""
    
    def __init__(self, cache_file: str = CACHE_FILE):
        self.cache_file = cache_file
        self.cache: Dict[str, Dict] = self._load_cache()
    
    def _load_cache(self) -> Dict[str, Dict]:
        """Charge le cache depuis le fichier JSON"""
        if os.path.exists(self.cache_file):
            try:
                with open(self.cache_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                print(f"⚠️  Error loading cache: {e}")
                return {}
        return {}
    
    def _save_cache(self):
        """Sauvegarde le cache dans le fichier JSON"""
        try:
            with open(self.cache_file, 'w', encoding='utf-8') as f:
                json.dump(self.cache, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"⚠️  Error saving cache: {e}")
    
    def get(self, video_id: str) -> Optional[str]:
        """Récupère la description d'une vidéo depuis le cache"""
        video_data = self.cache.get(video_id)
        if video_data:
            return video_data.get('description')
        return None
    
    def set(self, video_id: str, description: str, title: str = '', published_at: str = ''):
        """Stocke la description d'une vidéo dans le cache"""
        self.cache[video_id] = {
            'description': description,
            'title': title,
            'published_at': published_at,
            'cached_at': datetime.now().isoformat()
        }
        self._save_cache()
    
    def has(self, video_id: str) -> bool:
        """Vérifie si une vidéo est dans le cache"""
        return video_id in self.cache
    
    def get_stats(self) -> Dict:
        """Retourne des statistiques sur le cache"""
        return {
            'total_videos': len(self.cache),
            'cache_file': self.cache_file,
            'cache_size_mb': round(os.path.getsize(self.cache_file) / 1024 / 1024, 2) if os.path.exists(self.cache_file) else 0
        }
    
    def clear(self):
        """Vide le cache"""
        self.cache = {}
        self._save_cache()
        print("✅ Cache cleared")
    
    def export_to_file(self, filename: str):
        """Exporte le cache vers un fichier JSON"""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(self.cache, f, indent=2, ensure_ascii=False)
        print(f"✅ Cache exported to {filename}")