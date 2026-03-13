"""
Classe principale du scraper de cocktails
"""
import sys
import os
from datetime import date, datetime
import json
from typing import List, Dict, Optional
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from models import Cocktail, Ingredient, Video
from utils.youtube import YouTubeClient
from utils.parsers import (
    parse_recipe_blocks,
    extract_quantities,
    trim_ingredient_name,
    clean_cocktail_name
)
from utils.detectors import (
    detect_ingredient_type,
    find_base_spirit,
    calculate_abv,
    detect_method,
    detect_difficulty
)


def _recipe_fingerprint(ingredients: List[Ingredient]) -> frozenset:
    """
    Génère une empreinte unique d'une recette basée sur ses ingrédients et quantités.
    Utilisée pour détecter les doublons exacts.
    """
    items = []
    for ing in ingredients:
        key = (
            ing.ingredient.lower().strip(),
            ing.oz,
            ing.ml,
            ing.dashes
        )
        items.append(key)
    return frozenset(items)


class CocktailScraper:
    """Scraper principal pour extraire les recettes de cocktails"""
    
    
    def __init__(self, api_key: str, channel_id: str, use_cache: bool = True):
        self.youtube_client = YouTubeClient(api_key, channel_id, use_cache=use_cache)
    
    
    def build_recipe(
        self, 
        block: List[str], 
        season: str, 
        video_id: str
    ) -> Optional[Cocktail]:
        """
        Convertit un bloc de recette brut en objet Cocktail
        """
        if not block:
            return None

        name_line = block[0]
        raw_name = name_line[:name_line.find("RECIPE")].strip()

        # Nettoyer le nom du cocktail
        name = clean_cocktail_name(raw_name)

        # Filtrer les noms invalides
        if not name or name.startswith('*') or name == "THE":
            return None

        # Parser les ingrédients
        ingredients = []
        for line in block[1:]:
            quantities = extract_quantities(line)
            ing_name = trim_ingredient_name(line)
            ing_type = detect_ingredient_type(line)
            
            ingredient = Ingredient(
                ingredient=ing_name,
                type=ing_type,
                oz=quantities.get('Oz'),
                ml=quantities.get('Ml'),
                dashes=quantities.get('Dashes')
            )
            ingredients.append(ingredient)

        # Convertir les ingrédients en dict pour les calculs
        ingredients_dict = [ing.to_dict() for ing in ingredients]
        
        # Détecter le spiritueux de base et la catégorie
        base_spirit, category = find_base_spirit(ingredients_dict)
        
        # Calculer l'ABV
        abv = calculate_abv(ingredients_dict)
        
        # Détecter la méthode
        method = detect_method(ingredients_dict)
        
        # Créer un dict temporaire pour detect_difficulty
        temp_cocktail = {
            'Recipe': ingredients_dict,
            'Method': method
        }
        
        # Détecter la difficulté  
        difficulty = detect_difficulty(temp_cocktail)

        # Créer le cocktail
        cocktail = Cocktail(
            name=name,
            recipe=ingredients,
            base_spirit=base_spirit,
            category=category,
            glass=None,
            method=method,
            difficulty=difficulty,
            abv=abv,
            description=None,
            profile=[],
            ice=[],
            season=[season],
            creator='Unknown',
            image=f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg",
            tags=[]
        )

        return cocktail
    
    def run(self, seasons_filter: Optional[List[str]] = None) -> Dict:
        """
        Exécute le processus complet de scraping
        """
        seasons_filter = [
            s.lower() 
            for s in (seasons_filter or ['autumn', 'winter', 'spring', 'summer'])
        ]

        print("=" * 60)
        print("🍸 COCKTAIL SCRAPER - Starting...")
        print("=" * 60)

        # 1. Récupérer toutes les vidéos
        print("\n[1/4] 📹 Fetching videos from YouTube...")
        all_videos = self.youtube_client.fetch_videos()
        
        # 2. Filtrer par saison
        videos = [v for v in all_videos if v['season'] in seasons_filter]
        print(f"✅ Videos after season filter: {len(videos)}")
        
        from collections import Counter
        season_counts = Counter(v['season'] for v in all_videos)
        print(f"📊 Videos per season (before filter):")
        for season, count in sorted(season_counts.items()):
            in_filter = "✓" if season in seasons_filter else "✗"
            print(f"  {in_filter} {season}: {count} videos")

        # 3. Parser les recettes
        print(f"\n[2/4] 📝 Parsing recipes...")
        cocktails: List[Cocktail] = []
        
        # Déduplication par nom normalisé ET par empreinte de recette
        seen_names: set = set()
        seen_fingerprints: set = set()
        duplicates_by_name = 0
        duplicates_by_recipe = 0

        videos_with_recipes = 0
        total_blocks_found = 0

        for i, video in enumerate(videos):
            if i % 10 == 0:
                print(f"  Progress: {i}/{len(videos)} videos processed")

            desc = self.youtube_client.get_video_description(
                video['video_id'],
                title=video.get('title', ''),
                published_at=video.get('published_at', '')
            )
            if not desc:
                continue

            blocks = parse_recipe_blocks(desc)
            
            if blocks:
                videos_with_recipes += 1
                total_blocks_found += len(blocks)

            for block in blocks:
                cocktail = self.build_recipe(
                    block, 
                    video['season'], 
                    video['video_id']
                )
                
                if not cocktail:
                    continue

                # Vérifier le doublon par nom
                normalized_name = cocktail.name.lower().strip()
                if normalized_name in seen_names:
                    duplicates_by_name += 1
                    continue

                #   Vérifier le doublon par recette (même ingrédients + quantités)
                fingerprint = _recipe_fingerprint(cocktail.recipe)
                if fingerprint in seen_fingerprints:
                    duplicates_by_recipe += 1
                    print(f"  ⚠️  Duplicate recipe (different name): '{cocktail.name}'")
                    continue

                seen_names.add(normalized_name)
                seen_fingerprints.add(fingerprint)
                cocktails.append(cocktail)

        # Stats de parsing
        print(f"\n📊 Parsing statistics:")
        print(f"  - Videos processed: {len(videos)}")
        print(f"  - Videos with recipes: {videos_with_recipes}")
        print(f"  - Total recipe blocks found: {total_blocks_found}")
        print(f"  - Duplicates removed (same name): {duplicates_by_name}")
        print(f"  - Duplicates removed (same recipe): {duplicates_by_recipe}")
        print(f"  - Unique cocktails extracted: {len(cocktails)}")

        # 4. Statistiques
        print(f"\n[3/4] 📊 Generating statistics...")
        methods_count = {}
        for cocktail in cocktails:
            method = cocktail.method or 'unknown'
            methods_count[method] = methods_count.get(method, 0) + 1
        
        print(f"  Methods detected:")
        for method, count in sorted(methods_count.items()):
            print(f"    - {method}: {count} cocktails")

        # 5. Exporter en JSON
        print(f"\n[4/4] 💾 Exporting to JSON...")
        output = {
            'cocktails': [c.to_dict() for c in cocktails]
        }
        
        today = date.today().strftime('%d-%m-%Y')
        seasons_str = "_".join(seasons_filter)
        filename = f"cocktails_{seasons_str}_{today}.json"

        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(output, f, indent=4, ensure_ascii=False)
        
        print(f"✅ Saved → {filename}")

        print("\n" + "=" * 60)
        print("🎉 COCKTAIL SCRAPER - Done!")
        print("=" * 60)

        print(f"\n[Stats] 📊 API Usage:")
        api_stats = self.youtube_client.get_api_stats()
        for key, value in api_stats.items():
            print(f"  - {key}: {value}")

        return output