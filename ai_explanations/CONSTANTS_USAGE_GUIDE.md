# 🎯 Guide d'utilisation des constantes centralisées

## 📍 Architecture

```
📁 constants/
  └── cocktail-constants.json  ← 📌 SOURCE DE VÉRITÉ UNIQUE

🔗 Consommée par:
  
  └── 📌 Frontend (Vue.js)
      └── src/lib/cocktail-constants.js (wrapper)
      └── src/Components/Modals/CocktailModal.vue (utilisation)
      
  └── 📌 Backend/Scraper (Python)
      └── scraper/constants/shared_constants.py (wrapper)
      └── scraper/supabase/ingredients.py (utilisation)
```

---

## 🔄 Migration depuis les anciennes sources

### **Avant (duplicatas) ❌**
```
❌ scraper/constants/ingredients_meta.py    (Python dict)
❌ src/constants/ingredientsDatabase.json   (JSON - peut diverger)
❌ src/Components/Modals/CocktailModal.vue  (hardcodé dans template)
```

### **Après (source unique) ✅**
```
✅ constants/cocktail-constants.json
   ├─ Utilisé par scraper/constants/shared_constants.py
   └─ Utilisé par src/lib/cocktail-constants.js
```

---

## 🐍 Utilisation côté Scraper (Python)

### Charger les ingrédients (remplacer `ingredients_meta.py`)
```python
# AVANT (incoherent)
from scraper.constants.ingredients_meta import TYPE_METADATA

# APRÈS (centralisé)
from scraper.constants.shared_constants import get_all_ingredients_dict

TYPE_METADATA = get_all_ingredients_dict()
```

### Accéder aux métadonnées d'un ingrédient
```python
from scraper.constants.shared_constants import get_ingredient_metadata

metadata = get_ingredient_metadata('bourbon')
# Returns: ('Bourbon', 'spirits', 40.0, 'Whiskey')
```

### Accéder aux autres constantes
```python
from scraper.constants.shared_constants import (
    get_glasses,
    get_methods,
    get_ice_types,
    get_profiles,
    get_seasons,
    get_cocktail_styles,
)

glasses = get_glasses()      # {'rocks': {...}, 'coupe': {...}}
methods = get_methods()      # {'stirred': {...}, 'shaken': {...}}
ice_types = get_ice_types()  # {'cubed': {...}, 'crushed': {...}}
```

---

## 🟦 Utilisation côté Frontend (Vue.js)

### Option 1: Import simple des constantes
```javascript
// src/Components/Modals/CocktailModal.vue

import { COCKTAIL_CONSTANTS } from '@/lib/cocktail-constants'

export default {
  setup() {
    const glasses = COCKTAIL_CONSTANTS.GLASSES
    const methods = COCKTAIL_CONSTANTS.METHODS
    const profiles = COCKTAIL_CONSTANTS.PROFILES_ARRAY  // Ready for v-for
    
    return { glasses, methods, profiles }
  }
}
```

### Option 2: Import des fonctions spécifiques
```javascript
import {
  getGlassesAsOptions,
  getMethodsAsOptions,
  getProfilesAsArray,
  getIceTypesAsArray,
  getCocktailStyles,
} from '@/lib/cocktail-constants'

const glassOptions = getGlassesAsOptions()
// Returns: [
//   { value: 'rocks', label: '🥃 Rocks (Old Fashioned)' },
//   { value: 'coupe', label: '🍸 Coupe' },
//   ...
// ]
```

### CocktailModal.vue - Exemple complet
```vue
<script setup>
import { getProfilesAsArray, getIceTypesAsArray } from '@/lib/cocktail-constants'

const profileOptions = getProfilesAsArray()
const iceOptions = getIceTypesAsArray()
</script>

<template>
  <!-- Profils de goût -->
  <div class="chips-container">
    <button
      v-for="p in profileOptions"
      :key="p.key"
      @click="toggleProfile(p.key)"
      :class="['chip', { active: form.profile.includes(p.key) }]"
    >
      {{ p.icon }} {{ p.label }}
    </button>
  </div>
  
  <!-- Types de glaçons -->
  <div class="chips-container">
    <button
      v-for="ice in iceOptions"
      :key="ice.key"
      @click="toggleIce(ice.key)"
      :class="['chip', { active: form.ice.includes(ice.key) }]"
    >
      {{ ice.icon }} {{ ice.label }}
    </button>
  </div>
</template>
```

---

## 📋 Fichier : `constants/cocktail-constants.json`

### Structure complète
```json
{
  "version": "1.0.0",
  "description": "Source unique pour tous les paramètres cocktail",
  
  "ingredients": {
    "spirits": { ... },      // Whiskey, Rum, Gin, Vodka, etc.
    "liqueurs": { ... },     // Amaretto, Chartreuse, etc.
    "modifiers": { ... },    // Vermouth, Sherry, Wine, etc.
    "juices": { ... },       // Citron, Lime, Orange, etc.
    "syrups": { ... },       // Sirop simple, Orgeat, etc.
    "bitters": { ... },      // Angostura, Peychaud's, etc.
    "mixers": { ... },       // Tonic, Ginger Beer, etc.
    "garnish": { ... }       // Menthe, Olive, Cerise, etc.
  },
  
  "glasses": { ... },        // rocks, coupe, martini, etc.
  "methods": { ... },        // stirred, shaken, built, etc.
  "difficulties": { ... },   // easy, medium, hard
  "ice_types": { ... },      // cubed, crushed, cracked, etc.
  "profiles": { ... },       // Citrus, Fruity, Herbal, etc.
  "seasons": { ... },        // spring, summer, fall, winter
  "cocktail_styles": [...]   // Classic, Modern, Tiki, etc.
}
```

### Format d'un ingrédient
```json
"bourbon": {
  "name": "Bourbon",
  "category": "spirits",
  "abv": 40.0,
  "family": "Whiskey"
}
```

### Format d'un verre/méthode/etc
```json
"rocks": {
  "name": "Rocks (Old Fashioned)",
  "emoji": "🥃"
}
```

---

## 🔍 Vérifier la cohérence

### Test Python
```bash
cd /workspaces/MartiniPlease
python -m scraper.constants.shared_constants
```

### Test JavaScript (dans Vue)
```javascript
import COCKTAIL_CONSTANTS from '@/lib/cocktail-constants'
console.log(COCKTAIL_CONSTANTS)
```

---

## ✅ Checklist de migration

- [ ] Utiliser `shared_constants.py` dans le scraper au lieu de `ingredients_meta.py`
- [ ] Rem​placer le JSON hardcodé dans CocktailModal.vue par `cocktail-constants.js`
- [ ] Ajouter les options `cocktail_style` et `ice_types` au formulaire
- [ ] Mettre à jour `useDataValidator.js` si nécessaire
- [ ] Tester que le scraper génère les mêmes données dans Supabase
- [ ] Vérifier que le frontend affiche les mêmes options cohérentes

---

## 🐛 Troubleshooting

### Erreur: "Module not found: cocktail-constants.json"
→ Vérifier que `constants/cocktail-constants.json` existe et que `vite.config.js` le résout

### Constantes vides au démarrage
→ Assurer que le JSON est valide: `python -c "import json; json.load(open('constants/cocktail-constants.json'))"`

### TypeScript avec Python
→ Exporter également un fichier `.d.ts` si nécessaire (avancé)

---

## 📚 Références

- **Frontend**: `src/lib/cocktail-constants.js`
- **Backend**: `scraper/constants/shared_constants.py`
- **Source unique**: `constants/cocktail-constants.json`
- **Documentation précédente**: `scraper/constants/ingredients_meta.py` (à archiver)
