# 📝 Exemples de migration

## 🔧 1. Migration du Scraper (Python)

### Avant ❌
```python
# scraper/supabase/ingredients.py
from scraper.constants.ingredients_meta import TYPE_METADATA

def insert_ingredients(bar_id):
    for ingredient_key, (name, category, abv, family) in TYPE_METADATA.items():
        supabase.table('ingredients').insert({
            'name': name,
            'type': ingredient_key,
            'category': category,
            'abv': abv,
            'family': family,
            'bar_id': bar_id,
        })
```

### Après ✅
```python
# scraper/supabase/ingredients.py
from scraper.constants.shared_constants import get_all_ingredients_dict

def insert_ingredients(bar_id):
    TYPE_METADATA = get_all_ingredients_dict()  # 📌 Source centrale
    
    for ingredient_key, (name, category, abv, family) in TYPE_METADATA.items():
        supabase.table('ingredients').insert({
            'name': name,
            'type': ingredient_key,
            'category': category,
            'abv': abv,
            'family': family,
            'bar_id': bar_id,
        })
```

---

## 🔧 2. Migration du Frontend Vue

### Avant ❌ (Dans le composant)
```vue
<script setup>
// Constantes hardcodées partout
const iceOptions = [
  { key: 'cubed',      icon: '🧊', label: 'Glaçons cubiques' },
  { key: 'crushed',    icon: '🧊', label: 'Glaçons concassés' },
  // ... etc
]

const profileOptions = [
  { key: 'Citrus',     icon: '🍋', label: 'Agrume' },
  { key: 'Fruity',     icon: '🍒', label: 'Fruité' },
  // ... etc
]

const glassesOptions = [
  { value: 'rocks', label: '🥃 Rocks (Old Fashioned)' },
  { value: 'coupe', label: '🍸 Coupe' },
  // ... etc
]
</script>
```

### Après ✅ (Utilise les constantes centrales)
```vue
<script setup>
import { 
  getProfilesAsArray, 
  getIceTypesAsArray, 
  getGlassesAsOptions 
} from '@/lib/cocktail-constants'

// 📌 Import des constantes centrales
const profileOptions = getProfilesAsArray()
const iceOptions = getIceTypesAsArray()
const glassOptions = getGlassesAsOptions()
</script>

<template>
  <!-- Les chips utilisent les mêmes données partout -->
  <button 
    v-for="p in profileOptions" 
    :key="p.key"
    @click="toggleProfile(p.key)"
  >
    {{ p.icon }} {{ p.label }}
  </button>
</template>
```

---

## 🔧 3. Synchroniser les données Supabase

### Avant ❌ (Deux sources divergentes)
```
❌ scraper/constants/ingredients_meta.py      (28 spiritueux)
❌ src/constants/ingredientsDatabase.json     (27 spiritueux - oups!)
❌ CocktailModal.vue                           (hardcodé, peut diverger)

→ RISQUE: Les données du scraper ≠ données du frontend
```

### Après ✅ (Une seule source)
```
✅ constants/cocktail-constants.json (SOURCE UNIQUE)
   ├─ Chargé par scraper/constants/shared_constants.py
   ├─ Chargé par src/lib/cocktail-constants.js
   └─ Exporté directement au frontend

→ GARANTIE: Scraper et frontend utilisent exactement les mêmes données
```

---

## 📋 Exemple complet: Créer des cocktails avec glasures

### Aspect du formulaire APRÈS la migration

```vue
<template>
  <!-- Verre -->
  <select v-model="form.glass" class="form-input">
    <option value="">-- Choisir --</option>
    <option v-for="(g, key) in glassOptions" :key="key" :value="key">
      {{ g.emoji }} {{ g.name }}
    </option>
  </select>

  <!-- Glaçons (nouveau!) -->
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

<script setup>
import { getGlassesAsOptions, getIceTypesAsArray } from '@/lib/cocktail-constants'

const glassOptions = getGlassesAsOptions()
const iceOptions = getIceTypesAsArray()
</script>
```

### Données envoyées à Supabase
```json
{
  "name": "Margarita",
  "glass": "rocks",  // ✅ Vient des constantes
  "ice": ["cubed", "crushed"],  // ✅ Nouveau! Vient des constantes
  "method": "shaken",
  // ... autres champs
}
```

---

## 🧪 Tests de cohérence

### Vérifier que le scraper == frontend

```python
# Côté Python: compter les ingrédients
from scraper.constants.shared_constants import get_all_ingredients_dict
all_ings = get_all_ingredients_dict()
print(f"Python: {len(all_ings)} ingrédients")
```

```javascript
// Côté JavaScript: compter les ingrédients
import { getAllIngredients } from '@/lib/cocktail-constants'
const allIngs = getAllIngredients()
console.log(`JavaScript: ${Object.keys(allIngs).length} ingrédients`)
```

→ Les deux nombres DOIVENT être identiques! ✅

---

## 🚀 Checklist de migration complète

- [ ] **Phase 1**: Créer les fichiers centraux
  - [x] `constants/cocktail-constants.json`
  - [x] `scraper/constants/shared_constants.py`
  - [x] `src/lib/cocktail-constants.js`

- [ ] **Phase 2**: Mettre à jour le scraper
  - [ ] `scraper/supabase/ingredients.py` → utiliser `shared_constants.py`
  - [ ] `scraper/utils/detectors.py` → utiliser `shared_constants.py`
  - [ ] Tests: `pytest scraper/tests/test_ingredients.py`

- [ ] **Phase 3**: Mettre à jour le frontend
  - [ ] `src/Components/Modals/CocktailModal.vue` → importer constantes
  - [ ] `src/composables/useCocktails.js` → importer constantes si nécessaire
  - [ ] Tester le formulaire de création en dev

- [ ] **Phase 4**: Validation
  - [ ] Créer un test de cohérence (py + js retournent mêmes données)
  - [ ] Lancer scraper avec nouvelles constantes
  - [ ] Vérifier Supabase = données attendues
  - [ ] Créer cocktail en frontend = fonctionne

- [ ] **Phase 5**: Cleanup
  - [ ] Archiver `scraper/constants/ingredients_meta.py`
  - [ ] Archiver `src/constants/ingredientsDatabase.json` (ancien)
  - [ ] Supprimer les fichiers hardcodés des composants

---

## 💡 Points clés

✅ **Cohérence**: Scraper et frontend utilisent les MÊMES données  
✅ **Maintenabilité**: Un seul fichier à mettre à jour  
✅ **Évolutivité**: Facile d'ajouter nouveaux profils/verres/etc  
✅ **Testabilité**: Vérifiable par des tests automatisés  
