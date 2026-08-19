## Scan/Import de recette (photo → formulaire cocktail)

### Recherche / choix technique
- [ ] Décider du provider vision : Gemini Flash (tier gratuit) vs Claude (payant après crédit d'essai)
- [ ] Vérifier les conditions d'usage des données sur le tier gratuit choisi (cf. RGPD ci-dessous)
- [ ] Tester manuellement le prompt sur 3-4 photos réelles (livre, écriture manuscrite, photo de mauvaise qualité) avant de coder quoi que ce soit — valider que la structure JSON attendue sort proprement

### Backend — Supabase Edge Function
- [ ] Créer la fonction `scan-recipe` (même pattern que la fonction d'email de bar existante)
- [ ] Stocker la clé API du provider en secret Supabase (`supabase secrets set`)
- [ ] Endpoint : reçoit image base64 + retourne JSON structuré (nom du cocktail si visible, liste d'ingrédients avec Category/Ingredient/Oz/Ml/Dash)
- [ ] Écrire le prompt système : décrire la taxonomie exacte (`CATEGORY_LABELS`), les unités (oz/ml), la gestion des "traits"/dashes, et forcer une sortie JSON stricte (pas de texte autour)
- [ ] Gérer les erreurs provider (timeout, 429 quota dépassé, image illisible) → retourner un code d'erreur exploitable côté front, pas un crash silencieux
- [ ] Logger les appels (au minimum un compteur) pour suivre le volume réel avant de se soucier d'un quota

### Frontend — CocktailFormModal.vue
- [ ] Ajouter le bouton "📷 Scanner une recette" dans la section Recette
- [ ] Input file avec `capture="environment"` pour ouvrir l'appareil photo sur mobile, sélecteur classique sur desktop
- [ ] État de chargement pendant l'appel (l'analyse peut prendre plusieurs secondes)
- [ ] Au retour : pré-remplir `form.recipe` avec les lignes extraites (sans jamais auto-save)
- [ ] Bandeau/notice visible "Vérifie les infos avant d'enregistrer" pour bien signaler que c'est une suggestion, pas une vérité

### Mapping vers la taxonomie existante
- [ ] Tentative de matching flou entre le nom d'ingrédient retourné par le LLM et `ingredients.value` (stock/DB) pour préremplir `Type` si une correspondance claire existe
- [ ] Si pas de correspondance : laisser `Type` vide, `Ingredient` rempli en texte libre — l'utilisateur complète manuellement via les select existants
- [ ] Préremplir `Category` en best-effort à partir de la catégorie devinée par le LLM (mappée sur `CATEGORY_LABELS`)

### Robustesse / abus
- [ ] Limiter le nombre de scans par bar/utilisateur (quota simple, ex: X par jour) pour éviter l'abus vu que chaque appel coûte quelque chose même sur un tier gratuit
- [ ] Fallback explicite si le provider est indisponible ou en quota dépassé : le formulaire reste utilisable en saisie manuelle normale, message clair à l'utilisateur
- [ ] Compresser/redimensionner l'image côté client avant envoi (évite des uploads énormes depuis un appareil photo mobile)

### Conformité / RGPD
- [ ] Vérifier si le provider choisi utilise les données envoyées pour l'entraînement (cas du tier gratuit Gemini) et si oui, l'indiquer dans `CookiesPolicy.vue` / bandeau de consentement
- [ ] S'assurer que l'image n'est pas stockée côté Supabase après analyse (sauf si volontairement conservée, à décider)

### QA avant mise en prod
- [ ] Tester sur photo de livre (imprimé) et sur papier manuscrit séparément — comportements différents attendus
- [ ] Tester sur mobile (iOS Safari + Android Chrome) le flow caméra complet
- [ ] Tester le cas "photo illisible / hors sujet" (ex: photo d'autre chose) → doit échouer proprement, pas halluciner une recette