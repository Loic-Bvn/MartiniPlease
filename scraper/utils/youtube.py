"""
Helpers pour interagir avec l'API YouTube
"""
from typing import List, Dict, Optional
from datetime import datetime
from googleapiclient.discovery import build
import requests

from .parsers import get_season
from .cache import VideoCache

# Clé réservée dans le cache pour stocker la liste des vidéos
_VIDEO_LIST_CACHE_KEY = '__video_list__'


class YouTubeClient:
    """Client pour interagir avec l'API YouTube"""

    def __init__(self, api_key: str, channel_id: str, use_cache: bool = True):
        self.api_key = api_key
        self.channel_id = channel_id
        from google.auth.credentials import AnonymousCredentials
        self.youtube = build(
            'youtube', 'v3',
            developerKey=api_key,
            credentials=AnonymousCredentials(),
            cache_discovery=False
        )
        self.use_cache = use_cache
        # Le cache est toujours instancié — use_cache contrôle uniquement
        # si on *lit* depuis le cache (descriptions + liste des vidéos).
        # L'écriture se fait toujours, pour garder le cache à jour même après --no-cache.
        self.cache = VideoCache()
        self.api_calls = 0

    def fetch_videos(self, max_videos: int = 500) -> List[Dict]:
        """
        Récupère toutes les vidéos de la chaîne et les tag avec leur saison.
        La liste est toujours écrite dans le cache après un fetch API,
        afin de garantir un résultat déterministe sur les runs suivants.
        (L'API YouTube Search est non-déterministe sur la pagination.)
        """
        # Lire depuis le cache uniquement si --no-cache n'est pas actif
        if self.use_cache:
            cached = self.cache.get_video_list()
            if cached is not None:
                print(f"✅ Fetched {len(cached)} videos (from cache)")
                return cached

        # Appeler l'API
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

        # Toujours écrire la liste dans le cache, même en --no-cache,
        # pour que le prochain run avec cache soit cohérent avec ce résultat.
        self.cache.set_video_list(videos)

        print(f"✅ Fetched {len(videos)} videos ({self.api_calls} API calls)")
        return videos

    def get_video_description(self, video_id: str, title: str = '', published_at: str = '') -> str:
        """
        Récupère la description complète d'une vidéo.
        Lit depuis le cache si use_cache=True, écrit toujours dans le cache.
        """
        if self.use_cache and self.cache.has(video_id):
            return self.cache.get(video_id)

        try:
            self.api_calls += 1
            resp = self.youtube.videos().list(part="snippet", id=video_id).execute()
            description = resp['items'][0]['snippet']['description'] if resp['items'] else ""

            if description:
                self.cache.set(video_id, description, title, published_at)

            return description
        except Exception as e:
            print(f"  ❌ Error {video_id}: {e}")
            return ""

    def get_api_stats(self) -> Dict:
        """Retourne les statistiques d'utilisation de l'API"""
        cache_stats = self.cache.get_stats()
        return {
            'api_calls':            self.api_calls,
            'estimated_quota_used': self.api_calls,
            'cache_enabled':        self.use_cache,
            'cached_videos':        cache_stats['total_videos'],
            'cache_size_mb':        cache_stats['cache_size_mb'],
        }