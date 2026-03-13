"""
Helpers pour interagir avec l'API YouTube
"""
from typing import List, Dict, Optional
from datetime import datetime
from googleapiclient.discovery import build
import requests

from .parsers import get_season
from .cache import VideoCache


class YouTubeClient:
    """Client pour interagir avec l'API YouTube"""
    
    def __init__(self, api_key: str, channel_id: str, use_cache: bool = True):
            self.api_key = api_key
            self.channel_id = channel_id
            #   Utiliser AnonymousCredentials pour éviter l'erreur ADC
            # quand on utilise uniquement une developerKey (pas d'OAuth)
            from google.auth.credentials import AnonymousCredentials
            self.youtube = build(
                'youtube', 'v3',
                developerKey=api_key,
                credentials=AnonymousCredentials(),
                cache_discovery=False
            )
            self.use_cache = use_cache
            self.cache = VideoCache() if use_cache else None
            self.api_calls = 0
    
    def fetch_videos(self, max_videos: int = 500) -> List[Dict]:
        """
        Récupère toutes les vidéos de la chaîne et les tag avec leur saison
        """
        videos = []
        url = (
            f'https://youtube.googleapis.com/youtube/v3/search'
            f'?part=snippet&channelId={self.channel_id}'
            f'&maxResults=50&order=date&type=video&key={self.api_key}'
        )

        while url and len(videos) < max_videos:
            self.api_calls += 1
            resp = requests.get(url).json()
            for item in resp.get('items', []):
                published = item['snippet']['publishedAt']
                dt = datetime.fromisoformat(published.replace('Z', '+00:00'))
                videos.append({
                    'video_id':     item['id']['videoId'],
                    'published_at': published,
                    'title':        item['snippet']['title'],
                    'season':       get_season(dt),
                })

            next_token = resp.get('nextPageToken')
            url = (
                f'https://youtube.googleapis.com/youtube/v3/search'
                f'?part=snippet&channelId={self.channel_id}'
                f'&maxResults=50&order=date&type=video'
                f'&pageToken={next_token}&key={self.api_key}'
            ) if next_token else None

        print(f"✅ Fetched {len(videos)} videos ({self.api_calls} API calls)")
        return videos
    
    def get_video_description(self, video_id: str, title: str = '', published_at: str = '') -> str:
        """
        Récupère la description complète d'une vidéo
        Utilise le cache si disponible
        """
        #   Vérifier le cache d'abord
        if self.use_cache and self.cache.has(video_id):
            return self.cache.get(video_id)
        
        # Sinon, appeler l'API
        try:
            self.api_calls += 1
            resp = self.youtube.videos().list(part="snippet", id=video_id).execute()
            description = resp['items'][0]['snippet']['description'] if resp['items'] else ""
            
            #   Stocker dans le cache
            if self.use_cache and description:
                self.cache.set(video_id, description, title, published_at)
            
            return description
        except Exception as e:
            print(f"  ❌ Error {video_id}: {e}")
            return ""
    
    def get_api_stats(self) -> Dict:
        """Retourne les statistiques d'utilisation de l'API"""
        stats = {
            'api_calls': self.api_calls,
            'estimated_quota_used': self.api_calls * 1  # 1 quota unit par call
        }
        
        if self.cache:
            cache_stats = self.cache.get_stats()
            stats.update({
                'cache_enabled': True,
                'cached_videos': cache_stats['total_videos'],
                'cache_size_mb': cache_stats['cache_size_mb']
            })
        else:
            stats['cache_enabled'] = False
        
        return stats