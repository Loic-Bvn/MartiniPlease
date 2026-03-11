# 🍸 MartiniPlease

**MartiniPlease** est une application de gestion de home bar : elle scrape des recettes de cocktails depuis YouTube, les stocke dans une base de données Supabase, et les affiche dans une interface web Vue 3.

---

## Architecture

```
MartiniPlease/
├── scraper/          # Scraper Python (YouTube → JSON → Supabase)
└── src/              # Frontend Vue 3 (affichage + gestion du bar)
```

**Stack :**
- Frontend : Vue 3 + Vite + Supabase JS
- Backend : Python 3, YouTube Data API v3, Supabase Python
- Base de données : Supabase (PostgreSQL)
- Déploiement : GitHub Pages via GitHub Actions

---

## 1. Scraper Python

Le scraper récupère les descriptions de vidéos d'une chaîne YouTube (par défaut : [Anders Erickson](https://www.youtube.com/@AndersErickson)), en extrait les recettes de cocktails via du parsing NLP, et produit un fichier JSON structuré.

### Installation

```bash
cd scraper
pip install -r requirements.txt
```

### Configuration des secrets

Les credentials ne sont jamais stockés dans le projet. Ils sont gérés via **GitHub Secrets** :

**Secrets à créer dans GitHub** (Settings > Secrets and variables > Actions) :

| Secret                | Description                                                                 |
|-----------------------|-----------------------------------------------------------------------------|
| `YOUTUBE_API_KEY`     | Clé YouTube Data API v3 ([Google Cloud Console](https://console.cloud.google.com/)) |
| `YOUTUBE_CHANNEL_ID`  | ID de la chaîne YouTube à scraper                                          |
| `SUPABASE_URL`        | URL du projet Supabase (Project Settings > API)                            |
| `SUPABASE_KEY`        | Clé `anon` Supabase (Project Settings > API)                               |

### Lancer le scraper depuis GitHub Actions (recommandé)

Dans l'onglet **Actions** du dépôt, sélectionner le workflow **"Run Scraper"** et cliquer sur **"Run workflow"**.

Options disponibles :
- `seasons` : saisons à scraper (`autumn winter spring summer` par défaut)
- `no_cache` : forcer le rechargement depuis l'API YouTube

Le JSON produit est disponible en téléchargement dans les **Artifacts** du run (conservé 30 jours).

### Lancer le scraper en local

Le script `run_scraper.sh` injecte les secrets depuis le trousseau système (macOS Keychain ou GNOME Keyring) sans jamais écrire de fichier `.env`.

**Prérequis :** [GitHub CLI](https://cli.github.com/) installée et authentifiée (`gh auth login`).

**Enregistrer les secrets une seule fois (macOS) :**
```bash
security add-generic-password -a "$USER" -s MARTINI_YOUTUBE_API_KEY    -w 'ta_clé_youtube'
security add-generic-password -a "$USER" -s MARTINI_YOUTUBE_CHANNEL_ID -w 'UCEK-PgJHg4Jupi7k7re0qGg'
security add-generic-password -a "$USER" -s MARTINI_SUPABASE_URL        -w 'https://xxx.supabase.co'
security add-generic-password -a "$USER" -s MARTINI_SUPABASE_KEY        -w 'ta_clé_supabase'
```

**Lancer le scraper :**
```bash
# Toutes les saisons
./run_scraper.sh

# Saisons spécifiques
./run_scraper.sh --seasons autumn winter

# Sans cache
./run_scraper.sh --no-cache

# Stats du cache
./run_scraper.sh --cache-stats

# Vider le cache
./run_scraper.sh --clear-cache
```

Le scraper produit un fichier JSON à la racine du projet, ex : `cocktails_autumn_winter_spring_summer_10-03-2026.json`

### Importer dans Supabase

Une fois le JSON généré, deux scripts permettent de peupler la base :

**Importer les recettes :**
```bash
python scraper/supabase/recipes.py cocktails_autumn_winter_spring_summer_10-03-2026.json
```

**Générer et importer la table des ingrédients :**
```bash
python scraper/supabase/ingredients.py
```

> Ces deux scripts lisent `SUPABASE_URL` et `SUPABASE_KEY` depuis `scraper/.env`.

---

## 2. Frontend Vue 3

L'interface permet de :
- Parcourir et filtrer les cocktails (par spiritueux, saison, ingrédients disponibles)
- Gérer l'inventaire du bar (marquer les ingrédients disponibles)
- Afficher les recettes détaillées
- Gérer une file de commandes

### Installation

```bash
npm install
```

### Configuration

Copier le fichier d'exemple à la racine :

```bash
cp .env.example .env.local
```

Variables requises dans `.env.local` :

| Variable               | Description                                      |
|------------------------|--------------------------------------------------|
| `VITE_SUPABASE_URL`    | URL du projet Supabase                          |
| `VITE_SUPABASE_ANON_KEY` | Clé `anon` Supabase                           |

### Développement

```bash
npm run dev
```

### Build & déploiement

Le déploiement sur GitHub Pages est automatisé via GitHub Actions (`.github/workflows/deploy.yml`) sur push vers la branche `rework-project`.

Les secrets `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` doivent être configurés dans **Settings > Secrets and variables > Actions** du dépôt GitHub.

```bash
# Build local
npm run build
```

---

## Sécurité

> ⚠️ **Ne jamais committer de clés API ou tokens dans le code.**

- Les fichiers `.env` et `scraper/.env` sont ignorés par git (voir `.gitignore`)
- Le frontend utilise des variables `VITE_*` (publiques côté client) — n'y mettre que la clé `anon` Supabase
- Pour le scraper (usage local uniquement), utiliser `scraper/.env`

---

## Structure de la base de données

**Table `cocktails`**

| Colonne       | Type      | Description                        |
|---------------|-----------|------------------------------------|
| `id`          | uuid      | Identifiant unique                 |
| `name`        | text      | Nom du cocktail                    |
| `base_spirit` | text      | Spiritueux de base                 |
| `category`    | text      | Catégorie (sour, fizz, etc.)       |
| `glass`       | text      | Type de verre                      |
| `method`      | text      | Méthode (shake, stir, build...)    |
| `difficulty`  | text      | Difficulté (easy, medium, hard)    |
| `abv`         | float     | Degré d'alcool estimé              |
| `description` | text      | Description                        |
| `profile`     | text[]    | Profil gustatif                    |
| `ice`         | text[]    | Type de glace                      |
| `season`      | text[]    | Saisons recommandées               |
| `creator`     | text      | Auteur / chaîne source             |
| `image`       | text      | URL miniature YouTube              |
| `tags`        | text[]    | Tags libres                        |
| `recipe`      | jsonb[]   | Liste des ingrédients + quantités  |

**Table `ingredients`**

| Colonne     | Type    | Description                              |
|-------------|---------|------------------------------------------|
| `id`        | uuid    | Identifiant unique                       |
| `type`      | text    | Clé de matching (ex: `bourbon`)          |
| `name`      | text    | Nom affiché (ex: `Bourbon`)              |
| `category`  | text    | Catégorie (spirits, licors, syrups...)   |
| `available` | boolean | Présent dans le bar (géré via l'UI)      |