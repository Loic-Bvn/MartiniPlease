#!/bin/bash
# run_scraper.sh
# Lance le scraper en injectant les secrets depuis GitHub via la CLI `gh`.
#
# Prérequis :
#   - GitHub CLI installée : https://cli.github.com/
#   - Authentifié : gh auth login
#   - Secrets configurés dans le dépôt GitHub :
#       YOUTUBE_API_KEY, YOUTUBE_CHANNEL_ID, SUPABASE_URL, SUPABASE_KEY
#
# Usage :
#   ./run_scraper.sh                          # toutes les saisons
#   ./run_scraper.sh --seasons autumn winter  # saisons spécifiques
#   ./run_scraper.sh --no-cache               # sans cache
#   ./run_scraper.sh --cache-stats            # stats du cache

set -e

# ── Vérifier que gh est installé ──────────────────────────
if ! command -v gh &> /dev/null; then
  echo "❌ GitHub CLI (gh) non trouvée."
  echo "   Installer : https://cli.github.com/"
  exit 1
fi

# ── Vérifier l'authentification ───────────────────────────
if ! gh auth status &> /dev/null; then
  echo "❌ Non authentifié. Lancer : gh auth login"
  exit 1
fi

# ── Récupérer les secrets depuis GitHub ───────────────────
echo "🔑 Récupération des secrets GitHub..."

REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null)
if [ -z "$REPO" ]; then
  echo "❌ Impossible de détecter le dépôt. Vérifier que tu es dans le bon dossier."
  exit 1
fi

export YOUTUBE_API_KEY=$(gh secret list --repo "$REPO" | grep -q "YOUTUBE_API_KEY" \
  && gh api "/repos/$REPO/actions/secrets/YOUTUBE_API_KEY" --jq '.name' > /dev/null 2>&1 \
  && gh secret list --repo "$REPO" > /dev/null \
  && eval "$(gh secret list --repo "$REPO" -q)" 2>/dev/null || true)

# gh ne permet pas de lire la valeur des secrets (par design de sécurité).
# On passe par gh run ou on demande à l'utilisateur de les définir via
# des variables d'environnement exportées dans le shell courant.
#
# La méthode recommandée : définir les variables dans ton shell avant de lancer ce script.
# Exemple dans ~/.zshrc ou ~/.bashrc :
#   export YOUTUBE_API_KEY=$(gh secret list ... )  <- impossible, voir note ci-dessous
#
# ⚠️  GitHub ne permet PAS de lire la valeur d'un secret via l'API (c'est intentionnel).
# La bonne pratique est donc de les stocker dans le trousseau du système (keychain/keyring)
# et de les injecter ici. Ce script supporte deux méthodes :

# ── Méthode A : variables déjà dans l'environnement ───────
if [ -n "$YOUTUBE_API_KEY" ] && [ -n "$SUPABASE_URL" ] && [ -n "$SUPABASE_KEY" ]; then
  echo "✅ Variables d'environnement détectées dans le shell."

# ── Méthode B : macOS Keychain ────────────────────────────
elif command -v security &> /dev/null; then
  echo "🔐 Lecture depuis le macOS Keychain..."
  export YOUTUBE_API_KEY=$(security find-generic-password -a "$USER" -s "MARTINI_YOUTUBE_API_KEY" -w 2>/dev/null || echo "")
  export YOUTUBE_CHANNEL_ID=$(security find-generic-password -a "$USER" -s "MARTINI_YOUTUBE_CHANNEL_ID" -w 2>/dev/null || echo "UCEK-PgJHg4Jupi7k7re0qGg")
  export SUPABASE_URL=$(security find-generic-password -a "$USER" -s "MARTINI_SUPABASE_URL" -w 2>/dev/null || echo "")
  export SUPABASE_KEY=$(security find-generic-password -a "$USER" -s "MARTINI_SUPABASE_KEY" -w 2>/dev/null || echo "")

  if [ -z "$YOUTUBE_API_KEY" ] || [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
    echo ""
    echo "❌ Secrets introuvables dans le Keychain."
    echo ""
    echo "   Pour les enregistrer (une seule fois) :"
    echo "   security add-generic-password -a \"\$USER\" -s MARTINI_YOUTUBE_API_KEY   -w 'ta_clé'"
    echo "   security add-generic-password -a \"\$USER\" -s MARTINI_YOUTUBE_CHANNEL_ID -w 'UCEK-PgJHg4Jupi7k7re0qGg'"
    echo "   security add-generic-password -a \"\$USER\" -s MARTINI_SUPABASE_URL       -w 'https://xxx.supabase.co'"
    echo "   security add-generic-password -a \"\$USER\" -s MARTINI_SUPABASE_KEY       -w 'ta_clé_supabase'"
    echo ""
    exit 1
  fi
  echo "✅ Secrets chargés depuis le macOS Keychain."

# ── Méthode C : Linux secret-tool (GNOME Keyring) ─────────
elif command -v secret-tool &> /dev/null; then
  echo "🔐 Lecture depuis GNOME Keyring..."
  export YOUTUBE_API_KEY=$(secret-tool lookup service martiniPlease key YOUTUBE_API_KEY 2>/dev/null || echo "")
  export YOUTUBE_CHANNEL_ID=$(secret-tool lookup service martiniPlease key YOUTUBE_CHANNEL_ID 2>/dev/null || echo "UCEK-PgJHg4Jupi7k7re0qGg")
  export SUPABASE_URL=$(secret-tool lookup service martiniPlease key SUPABASE_URL 2>/dev/null || echo "")
  export SUPABASE_KEY=$(secret-tool lookup service martiniPlease key SUPABASE_KEY 2>/dev/null || echo "")

  if [ -z "$YOUTUBE_API_KEY" ] || [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
    echo ""
    echo "❌ Secrets introuvables dans GNOME Keyring."
    echo ""
    echo "   Pour les enregistrer (une seule fois) :"
    echo "   secret-tool store --label='MartiniPlease' service martiniPlease key YOUTUBE_API_KEY"
    echo "   secret-tool store --label='MartiniPlease' service martiniPlease key SUPABASE_URL"
    echo "   secret-tool store --label='MartiniPlease' service martiniPlease key SUPABASE_KEY"
    echo ""
    exit 1
  fi
  echo "✅ Secrets chargés depuis GNOME Keyring."

else
  echo ""
  echo "❌ Aucune source de secrets disponible."
  echo ""
  echo "   Options :"
  echo "   1. Exporter les variables dans ton shell avant de lancer ce script :"
  echo "      export YOUTUBE_API_KEY='...'"
  echo "      export SUPABASE_URL='...'"
  echo "      export SUPABASE_KEY='...'"
  echo "      ./run_scraper.sh"
  echo ""
  echo "   2. Utiliser le macOS Keychain (macOS) ou GNOME Keyring (Linux)"
  echo "      (relancer ce script après installation)"
  echo ""
  exit 1
fi

# ── Vérification finale ────────────────────────────────────
if [ -z "$YOUTUBE_API_KEY" ]; then
  echo "❌ YOUTUBE_API_KEY manquante"
  exit 1
fi
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
  echo "❌ SUPABASE_URL ou SUPABASE_KEY manquante"
  exit 1
fi

# ── Lancer le scraper ──────────────────────────────────────
echo ""
echo "🍸 Lancement du scraper MartiniPlease..."
echo ""

python -m scraper.main "$@"
