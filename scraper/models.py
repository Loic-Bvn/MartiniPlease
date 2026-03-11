"""
Modèles de données pour le scraper
"""
from dataclasses import dataclass, field
from typing import List, Optional, Dict


@dataclass
class Ingredient:
    """Représente un ingrédient dans une recette"""
    ingredient: str
    type: str
    oz: Optional[float] = None
    ml: Optional[float] = None
    dashes: Optional[int] = None

    def to_dict(self) -> Dict:
        result = {
            'Ingredient': self.ingredient,
            'Type': self.type
        }
        if self.oz is not None:
            result['Oz'] = self.oz
        if self.ml is not None:
            result['Ml'] = self.ml
        if self.dashes is not None:
            result['Dashes'] = self.dashes
        return result


@dataclass
class Cocktail:
    """Représente un cocktail complet"""
    name: str
    recipe: List[Ingredient]
    base_spirit: Optional[str] = None
    category: Optional[str] = None
    glass: Optional[str] = None
    method: Optional[str] = None
    difficulty: Optional[str] = None
    abv: Optional[int] = None
    description: Optional[str] = None
    profile: List[str] = field(default_factory=list)
    ice: List[str] = field(default_factory=list)
    season: List[str] = field(default_factory=list)
    creator: str = 'Unknown'
    image: Optional[str] = None
    tags: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict:
        return {
            'Name': self.name,
            'BaseSpirit': self.base_spirit,
            'Category': self.category,
            'Glass': self.glass,
            'Method': self.method,
            'Difficulty': self.difficulty,
            'ABV': self.abv,
            'Description': self.description,
            'Profile': self.profile,
            'Ice': self.ice,
            'Season': self.season,
            'Creator': self.creator,
            'Image': self.image,
            'Tags': self.tags,
            'Recipe': [ing.to_dict() for ing in self.recipe]
        }


@dataclass
class Video:
    """Représente une vidéo YouTube"""
    video_id: str
    published_at: str
    title: str
    season: str