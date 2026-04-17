<template>
  <div class="min-h-screen menu-app">

    <!-- Header -->
    <div class="header">
      <div class="header-container">
        <div class="header-top">
          <div class="header-brand" @click="handleLogoClick" style="cursor: pointer;">
            <!-- <img src="/margarita_square.png" alt="MartiniPlease" class="header-logo" /> -->
            <img v-if="randomLogo" :src="randomLogo" alt="/margarita_square.png" class="header-logo" />

            <h1 class="header-title">{{ activeBarName }}</h1>
          </div>
          <!-- Barre de recherche masquée sur l'écran d'accueil -->
          <div v-if="activeBarId" class="search-wrapper header-search-inline">
            <Search class="search-icon" :size="16" />
            <input 
              type="text" 
              :placeholder="t.searchPlaceholder" 
              v-model="searchTerm" 
              class="search-input"
              @focus="showSearchSuggestions = searchTerm.length > 0"
              @blur="setTimeout(() => showSearchSuggestions = false, 150)"
            />
            <transition name="fade">
              <div v-if="showSearchSuggestions && suggestions.length > 0" class="search-suggestions" @click.stop>
                <div v-for="suggestion in suggestions" :key="suggestion.id" class="suggestion-item" @click="scrollToCocktailCard(suggestion.id)">
                  <span class="suggestion-type">🍹</span>
                  <span class="suggestion-name">{{ suggestion.name }}</span>
                </div>
              </div>
            </transition>
          </div>
          <div class="header-right" style="display:flex; align-items:center; gap:0.5rem;">
            <div class="header-actions">

              <!-- Bartender connecté -->
              <template v-if="activeBarId && isLoggedIn && !showBarsSelection">
                <button @click="openNewModal" class="btn-new-cocktail">
                  <Plus :size="15" /><span class="btn-label-hide"> {{ t.newCocktail }}</span>
                </button>
              </template>

              <!-- Drinker (visible uniquement si bar chargé et pas bartender connecté) -->
              <DrinkerPanel v-if="activeBarId && !isLoggedIn" :bar-id="activeBarId" />

              <button @click="locale = locale === 'fr' ? 'en' : 'fr'" class="btn-mode btn-mode-inactive">
                {{ locale === 'fr' ? '🇬🇧' : '🇫🇷' }}
              </button>
              <button v-if="activeBarId && !showBarsSelection" @click="unit = unit === 'oz' ? 'ml' : 'oz'" class="btn-mode btn-mode-inactive" :title="unit === 'oz' ? 'Passer en ml' : 'Switch to oz'">
                {{ unit === 'oz' ? 'ml' : 'oz' }}
              </button>
            </div>
            <ThemeToggle />

          <div v-if="toastMessage" class="toast">
            {{ toastMessage }}
          </div>

            <!-- Menu burger tout à droite (bartender uniquement) --><!-- Menu burger tout à droite -->
            <div v-if="isLoggedIn" class="burger-wrapper">
              <button 
                @click="burgerOpen = !burgerOpen" 
                class="btn-mode btn-mode-inactive burger-button"
                title="Plus d'options"
              >
                <Menu :size="16" />
              </button>

              <transition name="fade-slide">
                <div v-if="burgerOpen" class="burger-dropdown" @click.stop>

                  <div v-if="activeBarId" class="burger-header">
                    <span class="burger-title">
                      <Martini :size="16" />
                      {{ activeBarName }}
                    </span>

                    <span class="burger-subtitle">
                      <Key :size="14" />
                      {{ inviteCode }}
                    </span>
                  </div>
                  <div v-if="activeBarId" class="burger-divider" />

                  <button 
                    v-if="activeBarId && !showBarsSelection" 
                    @click="handleInvite" 
                    class="burger-item burger-item--primary"
                  >
                    <Link :size="15" />
                    {{ locale === 'fr' ? 'Inviter au bar' : 'Invite to bar' }}
                  </button>

                  <!-- SECTION : GESTION -->
                  <div v-if="bars.length >= 1 && !showBarsSelection && activeBarId">
                    <button 
                      @click="showBarsSelection = true; burgerOpen = false; searchTerm.value = ''"
                      class="burger-item"
                    >
                      <Folder :size="16" />
                      {{ locale === 'fr' ? 'Gérer mes bars' : 'Manage bars' }}
                    </button>
                  </div>


                  <button 
                    v-if="activeBarId && !showBarsSelection" 
                    @click="handleTogglePublic" 
                    class="burger-item burger-item--toggle"
                  >
                    <!-- Icône dynamique -->
                    <component 
                      :is="isBarPublic ? Unlock : Lock" 
                      :size="15" 
                    />

                    <span>
                      {{ isBarPublic 
                        ? (locale === 'fr' ? 'Bar public' : 'Public bar') 
                        : (locale === 'fr' ? 'Bar privé' : 'Private bar') 
                      }}
                    </span>

                    <!-- Toggle -->
                    <div class="toggle-switch" :class="{ 'on': isBarPublic }">
                      <div class="toggle-knob"></div>
                    </div>
                  </button>

                  <div v-if="activeBarId" class="burger-divider" />

                  <!-- SECTION : CATALOG -->
                  <button 
                    v-if="activeBarId && !showBarsSelection" 
                    @click="showCatalogModal = true; burgerOpen = false" 
                    class="burger-item"
                  >
                    <Library :size="15" />
                    {{ locale === 'fr' ? 'Catalogue de recettes' : 'Recipe Catalog' }}
                  </button> 

                  <div v-if="activeBarId" class="burger-divider" />

                  <!-- SECTION : DISCONNECT -->
                  <button 
                    @click="handleSignOut(); burgerOpen = false" 
                    class="burger-item burger-item--danger"
                  >
                    <LogOut :size="15" />
                    {{ locale === 'fr' ? 'Se déconnecter' : 'Sign out' }}
                  </button>

                </div>
              </transition>

              <div 
                v-if="burgerOpen" 
                class="burger-overlay" 
                @click="burgerOpen = false" 
              />
            </div>
          </div>
        </div>
        <!-- Barre de recherche mobile masquée sur l'écran d'accueil -->
        <div v-if="activeBarId" class="header-search-row">
          <div class="search-container">
            <Search class="search-icon" :size="16" />
            <input type="text" :placeholder="t.searchPlaceholderShort" v-model="searchTerm" class="search-input" />
          </div>
        </div>
      </div>
    </div>

    <!-- État : pas connecté + pas de bar -->
    <div v-if="!isLoggedIn && !activeBarId" class="main-content">
      <div class="welcome-screen">
        <img :src="randomLogo" alt="Martini Please" class="welcome-logo" />
        <h2 class="welcome-title">Martini Please</h2>
        <p class="welcome-subtitle">{{ locale === 'fr' ? 'Gérez votre bar, explorez les cocktails.' : 'Manage your bar, explore cocktails.' }}</p>

        <div class="welcome-cards">

          <!-- Bloc Bartender -->
          <div class="welcome-card">
            <div class="welcome-card-header">
              <span class="welcome-card-icon">🍾</span>
              <div>
                <div class="welcome-card-title">Bartender</div>
                <div class="welcome-card-desc">{{ locale === 'fr' ? 'Gérez votre stock et vos recettes' : 'Manage your stock and recipes' }}</div>
              </div>
            </div>
            <button @click="showAuthModal = true" class="password-btn-submit welcome-btn">
              {{ locale === 'fr' ? 'Créer ou accéder à mon bar' : 'Create or access my bar' }}
            </button>
          </div>

          <!-- Bloc Drinker -->
          <div class="welcome-card">
            <div class="welcome-card-header">
              <span class="welcome-card-icon">🥂</span>
              <div>
                <div class="welcome-card-title">Drinker</div>
                <div class="welcome-card-desc">{{ locale === 'fr' ? 'Explorez la carte d\'un bar' : 'Explore a bar\'s menu' }}</div>
              </div>
            </div>

            <!-- Bars publics disponibles -->
            <template v-if="!publicBarsLoading && publicBars.length > 0">
              <p class="welcome-public-title">
                {{ locale === 'fr' ? 'Bars disponibles' : 'Available bars' }}
              </p>
              <button
                v-for="b in publicBars"
                :key="b.id"
                class="welcome-demo"
                @click="joinPublicBar(b)"
              >
                🍸 {{ b.name }}
                <span class="welcome-demo-code">{{ b.invite_code }}</span>
              </button>
              <div class="welcome-or-divider">
                <span>{{ locale === 'fr' ? 'ou entrer un code' : 'or enter a code' }}</span>
              </div>
            </template>
            <div v-if="publicBarsLoading" class="welcome-public-loading">
              {{ locale === 'fr' ? 'Chargement des bars...' : 'Loading bars...' }}
            </div>
            <div class="welcome-code-row">
              <input
                v-model="inviteCodeInput"
                type="text"
                :placeholder="locale === 'fr' ? 'Code du bar (ex: STAR-7514)' : 'Bar code (ex: STAR-7514)'"
                class="password-form-input welcome-code-input"
                @keyup.enter="joinByCode"
              />
              <button @click="joinByCode" class="password-btn-submit">
                {{ locale === 'fr' ? 'Rejoindre' : 'Join' }}
              </button>
            </div>
            <p v-if="codeError" class="password-form-error">{{ codeError }}</p>
          </div>

        </div>
      </div>
    </div>

    <!-- Sélecteur de bar (bartender connecté avec plusieurs bars) ou vue de gestion -->
    <div v-if="(isLoggedIn && hasMultipleBars) || showBarsSelection" class="main-content">
      <div class="welcome-screen">
        <img :src="randomLogo" alt="Martini Please" class="welcome-logo" />
        <h2 class="welcome-title">{{ locale === 'fr' ? 'Gérer vos bars' : 'Manage your bars' }}</h2>
        <p class="welcome-subtitle">{{ locale === 'fr' ? 'Créez, sélectionnez ou supprimez vos bars.' : 'Create, select or delete your bars.' }}</p>
        
        <!-- Bouton créer nouveau bar -->
        <div class="bars-management-header">
          <button v-if="!showNewBarInput" @click="showNewBarInput = true" class="btn-create-bar">
            <Plus :size="16" />
            {{ locale === 'fr' ? 'Créer un nouveau bar' : 'Create new bar' }}
          </button>
          <div v-else class="new-bar-input-group">
            <input
              v-model="newBarName"
              type="text"
              :placeholder="locale === 'fr' ? 'Nom du bar...' : 'Bar name...'"
              class="new-bar-input"
              @keyup.enter="handleCreateNewBar"
              @keyup.esc="showNewBarInput = false"
              autofocus
            />
            <button @click="handleCreateNewBar" class="btn-confirm" title="Créer">
              <Plus :size="14" />
            </button>
            <button @click="showNewBarInput = false" class="btn-cancel" title="Annuler">
              <X :size="14" />
            </button>
          </div>
        </div>
        
        <!-- Liste des bars -->
        <div class="welcome-cards bars-management-list">
          <div v-for="b in bars" :key="b.id" class="welcome-card bar-management-card">
            <!-- Mode édition -->
            <div v-if="editingBarId === b.id" class="bar-edit-mode">
              <div class="edit-field-group">
                <label class="edit-field-label">{{ locale === 'fr' ? 'Nom du bar:' : 'Bar name:' }}</label>
                <input 
                  v-model="editingBarName" 
                  type="text" 
                  class="edit-field-input"
                  :placeholder="locale === 'fr' ? 'Nom du bar...' : 'Bar name...'"
                  autofocus
                />
              </div>
              <div class="edit-field-group">
                <label class="edit-field-label">{{ locale === 'fr' ? 'Code d\'invitation:' : 'Invite code:' }}</label>
                <input 
                  v-model="editingBarCode" 
                  type="text" 
                  class="edit-field-input"
                  :placeholder="locale === 'fr' ? 'Code d\'invitation...' : 'Invite code...'"
                />
              </div>
              <div class="bar-edit-actions">
                <button @click="saveBarEdits(b.id)" :disabled="updatingBarId === b.id" class="btn-confirm">
                  {{ updatingBarId === b.id ? '⏳' : '✓' }} {{ locale === 'fr' ? 'Sauvegarder' : 'Save' }}
                </button>
                <button @click="cancelEditBar" :disabled="updatingBarId === b.id" class="btn-cancel">
                  {{ locale === 'fr' ? 'Annuler' : 'Cancel' }}
                </button>
              </div>
            </div>
            <!-- Mode affichage -->
            <div v-else>
              <div class="bar-header">
                <span class="welcome-card-icon">🍾</span>
                
                <!-- Infos -->
                <!-- <div style="flex: 1;">
                  <div class="welcome-card-title">{{ b.name }}</div>
                  <div class="welcome-card-desc">Code : <code>{{ b.invite_code }}</code></div>
                  <div style="margin-top: 8px;">
                    <span v-if="b.is_public" class="bar-status-badge public">🌐 Public</span>
                    <span v-else class="bar-status-badge private">🔒 {{ locale === 'fr' ? 'Privé' : 'Private' }}</span>
                  </div>
                </div> -->

                <div style="flex: 1;">
                  <div class="bar-title-row">
                    <div class="welcome-card-title">{{ b.name }}</div>

                    <span v-if="b.is_public" class="bar-status-badge public">🌐 Public</span>
                    <span v-else class="bar-status-badge private">🔒 {{ locale === 'fr' ? 'Privé' : 'Private' }}</span>
                  </div>

                  <div class="welcome-card-desc">
                    Code : <code>{{ b.invite_code }}</code>
                  </div>
                </div>

                <!-- Stats à droite -->
                <div class="bar-stats" @mouseenter="loadBarStats(b.id)">
                  <div class="bar-stat">
                    <div class="bar-stat-value">{{ barStatsMap[b.id]?.cocktails ?? '-' }}</div>
                    <div class="bar-stat-label">Cocktails</div>
                  </div>
                  <div class="bar-stat">
                    <div class="bar-stat-value">{{ barStatsMap[b.id]?.cards ?? '-' }}</div>
                    <div class="bar-stat-label">{{ locale === 'fr' ? 'Cartes' : 'Cards' }}</div>
                  </div>
                </div>
              </div>

              <div class="bar-actions-new">
                <div class="bar-actions-small">
                  <button @click="selectBar(b)" class="btn-select-bar-large">
                    <Check :size="18" /> {{ locale === 'fr' ? 'Sélectionner' : 'Select' }}
                  </button>
                  <button @click="startEditBar(b)" class="btn-action-small"><Pencil :size="14" /></button>
                  <button @click="startDeleteBar(b)" class="btn-action-small btn-action-small--danger"><Trash2 :size="14" /></button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Modal de confirmation de suppression -->
        <transition name="fade">
          <div v-if="barToDelete" class="modal-overlay" @click.self="barToDelete = null">
            <div class="modal-container modal-container--delete-bar">
              <div class="modal-header">
                <h2 class="modal-title">{{ locale === 'fr' ? '⚠️ Supprimer le bar' : '⚠️ Delete bar' }}</h2>
                <button @click="barToDelete = null" class="btn-icon btn-icon--close">
                  <X :size="20" />
                </button>
              </div>
              <div class="modal-body">
                <p class="delete-warning">
                  {{ locale === 'fr' 
                    ? `Êtes-vous sûr de vouloir supprimer le bar "${barToDelete.name}" ?` 
                    : `Are you sure you want to delete the bar "${barToDelete.name}"?` 
                  }}
                </p>
                <p class="delete-hint">
                  {{ locale === 'fr' 
                    ? 'Cette action est irréversible. Écrivez le mot de confirmation ci-dessous.' 
                    : 'This action is irreversible. Type the confirmation word below.' 
                  }}
                </p>
                <div class="delete-confirmation-group">
                  <label class="delete-confirmation-label">
                    {{ locale === 'fr' ? 'Écrivez' : 'Type' }} <strong>{{ barToDelete.name }}</strong> {{ locale === 'fr' ? 'pour confirmer:' : 'to confirm:' }}
                  </label>
                  <input
                    v-model="deleteConfirmationInput"
                    type="text"
                    :placeholder="barToDelete.name"
                    class="field-input delete-confirmation-input"
                    @keyup.enter="handleDeleteBar"
                  />
                </div>
              </div>
              <div class="modal-footer">
                <button @click="barToDelete = null" class="btn-modal-secondary">
                  {{ locale === 'fr' ? 'Annuler' : 'Cancel' }}
                </button>
                <button
                  @click="handleDeleteBar"
                  :disabled="deleteConfirmationInput !== barToDelete.name"
                  class="btn-modal-danger"
                >
                  {{ locale === 'fr' ? 'Supprimer' : 'Delete' }}
                </button>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>

    <!-- Main (bar chargé) -->
    <div v-else class="main-content">

      <!-- Inventaire (bartender mode) -->
      <div v-if="isLoggedIn" class="section-card">
        <button @click="showInventory = !showInventory" class="expand-actions-btn">
          <ChevronDown :size="18" :class="{ rotated: showInventory }" />
          <h2 class="section-title">
            {{ t.stock }}
            <span class="count-badge">{{ selectedCount }} / {{ totalCount }}</span>
          </h2>
          <span></span>
        </button>
        <InventoryManager v-if="showInventory" />
      </div>

      <!-- Filtres + Cartes + Profil drinker côte à côte -->
      <div class="side-by-side">

        <!-- Filtres -->
        <div  v-if="activeBarId" class="section-card">
          <button @click="showFilters = !showFilters" class="expand-actions-btn">
            <ChevronDown :size="18" :class="{ rotated: showFilters }" />
            <h2 class="section-title">{{ t.filterTitle }}</h2>
            <span></span>
          </button>

          <div v-if="showFilters" class="filters-dropdown-content">

            <div class="filter-group">
              <label class="filter-label">{{ t.filterMode }}</label>
              <div class="filter-mode-toggle">
                <button @click="filterMode = 'main'" :class="['filter-mode-btn', { active: filterMode === 'main' }]">
                  {{ t.filterMain }}
                </button>
                <button @click="filterMode = 'contains'" :class="['filter-mode-btn', { active: filterMode === 'contains' }]">
                  {{ t.filterContains }}
                </button>
              </div>
            </div>

            <div class="filter-group">
              <label class="filter-label">{{ t.filterSpirits }}</label>
              <div class="chips-container">
                <button
                  v-for="spirit in baseSpirits"
                  :key="spirit.key"
                  @click="toggleFamily(spirit.key)"
                  :class="['chip', { active: selectedFamilies.includes(spirit.key) }]"
                >{{ spirit.label }}</button>
              </div>
              <transition name="fade">
                <div v-if="activeSubSpirits.length" class="chips-container chips-container--sub">
                  <button
                    v-for="sub in activeSubSpirits"
                    :key="sub.key"
                    @click="toggleFilter(selectedSubSpirits, sub.key)"
                    :class="['chip chip--sub', { active: selectedSubSpirits.includes(sub.key) }]"
                  >{{ sub.label }}</button>
                </div>
              </transition>
            </div>

            <div class="filter-group">
              <label class="filter-label">{{ t.filterLiqueurs }}</label>
              <div class="chips-container">
                <button
                  v-for="liqueur in liqueurFamilies"
                  :key="liqueur.key"
                  @click="toggleFilter(selectedFamilies, liqueur.key)"
                  :class="['chip', { active: selectedFamilies.includes(liqueur.key) }]"
                >{{ liqueur.label }}</button>
              </div>
            </div>

            <div class="filter-group">
              <label class="filter-label">{{ t.filterSeason }}</label>
              <div class="chips-container">
                <button
                  v-for="season in seasons"
                  :key="season.key"
                  @click="season.key === 'all' ? selectedSeasons = [] : toggleFilter(selectedSeasons, season.key)"
                  :class="['chip', { active: season.key === 'all' ? selectedSeasons.length === 0 : selectedSeasons.includes(season.key) }]"
                >{{ season.icon }} {{ season.label }}</button>
              </div>
            </div>

            <div class="filter-group">
              <label class="filter-label">{{ t.filterAvail }}</label>
              <div class="chips-container">
                <button @click="showOnlyMakeable = !showOnlyMakeable" :class="['chip', { active: showOnlyMakeable }]">
                  {{ t.filterMakeable }}
                </button>
              </div>
            </div>

            <div class="filter-group">
              <label class="filter-label">{{ t.filterAbv }}</label>
              <div class="chips-container">
                <button @click="abvFilter = abvFilter === 'mocktail' ? null : 'mocktail'" :class="['chip', { active: abvFilter === 'mocktail' }]">
                  🧃 Mocktail
                </button>
                <button @click="abvFilter = abvFilter === 'low' ? null : 'low'" :class="['chip', { active: abvFilter === 'low' }]">
                  🍃 Low ABV <span class="chip-hint">&lt; 15°</span>
                </button>
              </div>
            </div>

            <div class="filter-group">
              <label class="filter-label">{{ t.filterProfile }}</label>
              <div class="chips-container">
                <button
                  v-for="p in profileFilters"
                  :key="p.key"
                  @click="toggleFilter(selectedProfiles, p.key)"
                  :class="['chip', { active: selectedProfiles.includes(p.key) }]"
                >{{ p.label }}</button>
              </div>
            </div>

            <div class="filter-group">
              <label class="filter-label">{{ t.filterStyle }}</label>
              <div class="chips-container">
                <button
                  v-for="s in styleFilters"
                  :key="s.key"
                  @click="toggleFilter(selectedStyles, s.key)"
                  :class="['chip', { active: selectedStyles.includes(s.key) }]"
                >{{ s.label }}</button>
              </div>
            </div>

            <!-- Filtre favoris (si drinker connecté) -->
            <div v-if="hasDrinker" class="filter-group">
              <label class="filter-label">{{ locale === 'fr' ? 'Mes favoris' : 'My favorites' }}</label>
              <div class="chips-container">
                <button @click="showOnlyFavorites = !showOnlyFavorites" :class="['chip', { active: showOnlyFavorites }]">
                  ❤️ {{ locale === 'fr' ? 'Mes favoris uniquement' : 'My favorites only' }}
                </button>
              </div>
            </div>

            <div v-if="hasActiveFilters" class="active-filters-bar">
              <span v-for="f in selectedFamilies" :key="f" class="filter-tag">
                {{ getFamilyLabel(f) }}<X @click="toggleFamily(f)" :size="14" />
              </span>
              <span v-for="s in selectedSubSpirits" :key="s" class="filter-tag filter-tag--sub">
                {{ getSubSpiritLabel(s) }}<X @click="toggleFilter(selectedSubSpirits, s)" :size="14" />
              </span>
              <!-- <span v-for="s in selectedSeasons" :key="s" class="filter-tag">
                {{ getSeasonLabel(s) }}<X @click="toggleFilter(selectedSeasons, s)" :size="14" />
              </span> -->
              <span v-if="abvFilter === 'mocktail'" class="filter-tag">
                🧃 Mocktail <X @click="abvFilter = null" :size="14" />
              </span>
              <span v-if="abvFilter === 'low'" class="filter-tag">
                🍃 Low ABV <X @click="abvFilter = null" :size="14" />
              </span>
              <span v-for="p in selectedProfiles" :key="p" class="filter-tag">
                {{ profileFilters.find(f => f.key === p)?.label }}
                <X @click="toggleFilter(selectedProfiles, p)" :size="14" />
              </span>
              <span v-for="s in selectedStyles" :key="s" class="filter-tag">
                {{ styleFilters.find(f => f.key === s)?.label }}
                <X @click="toggleFilter(selectedStyles, s)" :size="14" />
              </span>
              <button @click="clearFilters" class="clear-all-btn">{{ t.clearAll }}</button>
            </div>
          </div>
        </div>

        <!-- Cartes custom -->
        <div  v-if="activeBarId" class="section-card">
          <button @click="showCards = !showCards" class="expand-actions-btn">
            <ChevronDown :size="18" :class="{ rotated: showCards }" />
            <h2 class="section-title">
              {{ t.cardsTitle }}
              <span class="count-badge">{{ menuCards.length }}</span>
            </h2>
            <span></span>
          </button>
          <div v-if="showCards" class="cards-content">
            <div v-if="menuCards.length === 0" class="cards-empty">{{ t.noCard }}</div>
            <div v-else class="cards-grid">
              <div v-for="card in menuCards" :key="card.id" class="menu-card-item" @click="viewingCard = card" style="cursor: pointer;">
                <div class="menu-card-info">
                  <span class="menu-card-name">{{ card.name }}</span>
                  <span class="menu-card-count">{{ card.cocktail_ids?.length || 0 }} cocktail{{ (card.cocktail_ids?.length || 0) > 1 ? 's' : '' }}</span>
                </div>
                <div class="menu-card-actions" @click.stop>
                  <button class="btn-icon btn-icon--view" title="Visualiser" style="pointer-events: none;">
                    <Eye :size="16" />
                  </button>
                  <template v-if="isLoggedIn">
                    <button @click="openEditCardModal(card)" class="btn-icon btn-icon--edit" title="Modifier" style="pointer-events: auto;">
                      <Pencil :size="16" />
                    </button>
                    <button @click="handleDeleteCard(card.id)" class="btn-icon btn-icon--delete" title="Supprimer" style="pointer-events: auto;">
                      <Trash2 :size="16" />
                    </button>
                  </template>
                </div>
              </div>
            </div>
            <button v-if="activeBarId && isLoggedIn" @click="openNewCardModal()" class="btn-new-card">
              <Plus :size="15" /><span class="btn-label-hide"> {{ t.newCard }}</span>
            </button>
          </div>
        </div>

        <!-- Profil drinker (visible uniquement si connecté en tant que drinker) -->
        <div v-if="hasDrinker" class="section-card">
          <button @click="showDrinkerPanel = !showDrinkerPanel" class="expand-actions-btn">
            <ChevronDown :size="18" :class="{ rotated: showDrinkerPanel }" />
            <h2 class="section-title">
              👤 {{ drinkerPseudo }}
            </h2>
            <span></span>
          </button>
          <div v-if="showDrinkerPanel" class="filters-dropdown-content">

            <!-- Tabs Favoris / Historique -->
            <div class="auth-tabs" style="margin-bottom: 12px; border-bottom: 1px solid var(--color-border-tertiary);">
              <button :class="['auth-tab', { active: drinkerTab === 'favorites' }]" @click="drinkerTab = 'favorites'">
                ❤️ {{ locale === 'fr' ? 'Favoris' : 'Favorites' }}
                <span class="count-badge">{{ favorites.size }}</span>
              </button>
              <button :class="['auth-tab', { active: drinkerTab === 'history' }]" @click="drinkerTab = 'history'">
                🕐 {{ locale === 'fr' ? 'Historique' : 'History' }}
                <span class="count-badge">{{ history.length }}</span>
              </button>
            </div>

            <!-- Favoris -->
            <div v-if="drinkerTab === 'favorites'">
              <div v-if="favorites.size === 0" class="cards-empty">
                {{ locale === 'fr' ? 'Aucun favori pour l\'instant.' : 'No favorites yet.' }}
              </div>
              <div v-else class="cards-grid">
                <div v-for="cocktail in favoriteCocktails" :key="cocktail.id" class="menu-card-item">
                  <span class="menu-card-name">{{ cocktail.name }}</span>
                  <button @click="toggleFavorite(cocktail.id)" class="btn-icon btn-icon--delete" title="Retirer">
                    <Heart :size="14" fill="currentColor" style="color: #e05c6e" />
                  </button>
                </div>
              </div>
            </div>

            <!-- Historique -->
            <div v-if="drinkerTab === 'history'">
              <div v-if="history.length === 0" class="cards-empty">
                {{ locale === 'fr' ? 'Aucune commande encore.' : 'No orders yet.' }}
              </div>
              <div v-else class="cards-grid">
                <div v-for="(entry, i) in history" :key="i" class="menu-card-item">
                  <span class="menu-card-name">{{ getCocktailName(entry.cocktail_id) }}</span>
                  <span class="menu-card-count">{{ formatDate(entry.ordered_at) }}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- Commandes en attente (bartender mode) -->
        <div v-if="isLoggedIn && activeBarId" class="section-card">
          <button @click="showOrdersPanel = !showOrdersPanel" class="expand-actions-btn">
            <ChevronDown :size="18" :class="{ rotated: showOrdersPanel }" />
            <h2 class="section-title">
              🍸 {{ locale === 'fr' ? 'Commandes' : 'Orders' }}
              <span v-if="pendingOrdersCount > 0" class="count-badge pending-badge">{{ pendingOrdersCount }}</span>
            </h2>
            <span></span>
          </button>
          <div v-if="showOrdersPanel" class="filters-dropdown-content">
            <OrdersPanel :locale="locale" :unit="unit" />
          </div>
        </div>

      </div>

      <!-- Liste cocktails -->
      <div v-if="activeBarId">
        <h2 class="cocktails-header">
          {{ filteredCocktails.length }}
          {{ locale === 'fr'
            ? `cocktail${filteredCocktails.length > 1 ? 's' : ''} trouvé${filteredCocktails.length > 1 ? 's' : ''}`
            : `cocktail${filteredCocktails.length > 1 ? 's' : ''} found`
          }}
          <span v-if="showOnlyMakeable" class="cocktails-header-makeable">
            ({{ makeableCount }} {{ locale === 'fr' ? 'réalisables' : 'available' }})
          </span>
        </h2>
        <div v-if="cocktailsLoading" class="loading-state">{{ t.loading }}</div>
        <div v-else-if="filteredCocktails.length === 0" class="empty-state-enhanced">
          <div class="empty-state-icon">🍹</div>
          <h3 class="empty-state-title">{{ locale === 'fr' ? 'Aucun cocktail trouvé' : 'No cocktails found' }}</h3>
          <p class="empty-state-message">
            {{ locale === 'fr' 
              ? 'Essayez d\'ajuster vos filtres ou de chercher un autre ingrédient.' 
              : 'Try adjusting your filters or search for another ingredient.' 
            }}
          </p>
          <div class="empty-state-actions">
            <button v-if="hasActiveFilters" @click="clearFilters" class="empty-state-btn empty-state-btn-primary">
              {{ locale === 'fr' ? 'Effacer les filtres' : 'Clear filters' }}
            </button>
            <button v-if="isLoggedIn" @click="openNewModal" class="empty-state-btn empty-state-btn-primary">
              {{ locale === 'fr' ? '+ Créer un cocktail' : '+ Create cocktail' }}
            </button>
          </div>
        </div>
        <div v-else class="cocktails-grid">
          <div v-for="cocktail in filteredCocktails" :key="cocktail.id" :id="`cocktail-${cocktail.id}`">
            <CocktailCard
              :cocktail="cocktail"
              :isBartenderMode="isLoggedIn"
              :locale="locale"
              :unit="unit"
              :bar-id="activeBarId"
              @edit="openEditModal"
              @delete="handleDelete"
            />
          </div>
        </div>
      </div>

    </div>

    <!-- Modals -->
    <AuthModal v-if="showAuthModal" @close="showAuthModal = false" @success="onAuthSuccess" />
    <MenuCardModal v-if="showCardModal" :card="editingCard" :cocktails="cocktails" :locale="locale" @save="handleSaveCard" @close="showCardModal = false" />
    <CatalogModal v-if="showCatalogModal" @close="showCatalogModal = false" @imported="handleCatalogImport" />
    <CocktailModal v-if="showCocktailModal" :cocktail="editingCocktail" @save="handleSave" @close="showCocktailModal = false" :bar-id="activeBarId"/>
    <MenuCardView
      v-if="viewingCard"
      :card="viewingCard"
      :cocktails="cocktails"
      :locale="locale"
      :unit="unit"
      :bar-id="activeBarId"
      @close="viewingCard = null"
      @toggle-locale="locale = locale === 'fr' ? 'en' : 'fr'"
      @toggle-unit="unit = unit === 'oz' ? 'ml' : 'oz'"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { Search, ChevronDown, X, Plus, BookOpen, Library, Pencil, Trash2, Eye, Lock, Unlock, LogOut, Heart, Menu, Globe, EyeOff, Link, Check, Folder, Martini, Key} from 'lucide-vue-next'

import { useAuth }      from '@/composables/useAuth'
import { useCocktails } from '@/composables/useCocktails'
import { useInventory } from '@/composables/useInventory'
import { useMenuCards } from '@/composables/useMenuCards'
import { useDrinker }   from '@/composables/useDrinker'
import { useOrders }    from '@/composables/useOrders'
import { useSearchSuggestions } from '@/composables/useSearchSuggestions'
import { useBarStatistics } from '@/composables/useBarStatistics'
import { useFilterCounts } from '@/composables/useFilterCounts'

import CocktailCard    from '@/Components/CocktailCard.vue'
import InventoryManager from '@/Components/Modals/InventoryManager.vue'
import CocktailModal   from '@/Components/Modals/CocktailModal.vue'
import MenuCardModal   from '@/Components/Modals/MenuCardModal.vue'
import MenuCardView    from '@/Components/MenuCardView.vue'
import AuthModal       from '@/Components/Modals/AuthModal.vue'
import DrinkerPanel    from '@/Components/DrinkerPanel.vue'
import OrdersPanel     from '@/Components/OrdersPanel.vue'
import ThemeToggle     from '@/Components/ThemeToggle.vue'
import { getFamilyLabel as getFL } from '@/constants/typeLabels.js'
import { supabase }    from '@/lib/supabase'
import { parseHash, setHash, clearHash, buildShareUrl, slugify } from '@/composables/useRouter'
import { useCatalog } from '@/composables/useCatalog'
import CatalogModal from '@/Components/Modals/CatalogModal.vue'

const { isLoggedIn, currentBarId, currentBarName, inviteCode, bars, hasMultipleBars, isBarPublic, session, initAuth, signOut, fetchBar, switchBar, toggleBarPublic, createNewBar, updateBarName, updateInviteCode } = useAuth()

// Bar chargé via code d'invitation (guest sans compte)
const guestBar = ref(null)
const activeBarId   = computed(() => currentBarId.value ?? guestBar.value?.id ?? null)
const activeBarName = computed(() => currentBarName.value || guestBar.value?.name || 'Martini Please')
const { cocktails, loading: cocktailsLoading, fetchCocktails, createCocktail, updateCocktail, deleteCocktail } = useCocktails()
const { barInventory, ingredients, fetchIngredients, initializeDefaultIngredients } = useInventory()
const { menuCards, fetchMenuCards, createMenuCard, updateMenuCard, deleteMenuCard } = useMenuCards()
const { hasDrinker, drinkerPseudo, initDrinker, favorites, history, toggleFavorite, clearDrinker } = useDrinker()
const { fetchSnapshots } = useCatalog()

// Logos disponibles
const base = import.meta.env.BASE_URL // ex: '/'

const availableLogos = [
  `${base}margarita_square.png`,
  `${base}amaretto_sour_square.png`,
  `${base}aviation_square.png`,
  `${base}negroni_square.png`
]

// Fonction pour obtenir un logo aléatoire
function getRandomLogo() {
  return availableLogos[Math.floor(Math.random() * availableLogos.length)]
}

const randomLogo = ref(getRandomLogo())
// Logo → retour à l'écran de connexion
function handleLogoClick() {
  if (isLoggedIn.value) {
    handleSignOut()
  } else {
    guestBar.value          = null
    cocktails.value         = []
    ingredients.value       = []
    menuCards.value         = []
  }
}

const togglingPublic = ref(false)
const newBarName = ref('')
const showNewBarInput = ref(false)
const showBarsSelection = ref(false)
const barToDelete = ref(null)
const deleteConfirmationInput = ref('')

async function handleTogglePublic() {
  if (togglingPublic.value) return
  togglingPublic.value = true
  await toggleBarPublic()
  togglingPublic.value = false
}

async function handleSignOut() {
  await signOut()
  guestBar.value = null
  clearHash()
}

// Sélection d'un bar parmi plusieurs (cas multi-bars) dans l'écran de sélection
async function selectBar(b) {
  await fetchBar(b.id)
  showBarsSelection.value = false
  await Promise.all([
    fetchCocktails(b.id),
    fetchIngredients(b.id),
    fetchMenuCards(b.id),
  ])
}

// Créer un nouveau bar
async function handleCreateNewBar() {
  const name = newBarName.value.trim()
  if (!name) return
  const result = await createNewBar(name)
  if (result.success) {
    newBarName.value = ''
    showNewBarInput.value = false
    
    // Initialiser les ingrédients par défaut pour le nouveau bar
    try {
      await initializeDefaultIngredients(result.data.id)
    } catch (err) {
      console.error('⚠️ Error initializing ingredients:', err)
    }
    
    // Changer vers le nouveau bar créé
    await Promise.all([
      fetchCocktails(result.data.id),
      fetchIngredients(result.data.id),
      fetchMenuCards(result.data.id),
    ])
    showBarsSelection.value = false
  }
}

// Initier la suppression d'un bar
function startDeleteBar(bar) {
  barToDelete.value = bar
  deleteConfirmationInput.value = ''
}

const inviteCopied = ref(false)

const handleInvite = async () => {
  const link = `${window.location.origin}/bar/${activeBarId}`

  try {
    await navigator.clipboard.writeText(link)
    inviteCopied.value = true
    showToast(
      locale === 'fr' ? 'Lien copié 🍸' : 'Link copied 🍸'
    )

    setTimeout(() => {
      inviteCopied.value = false
    }, 2000)
  } catch (e) {
    console.error('Erreur copie lien', e)
  }
}


// Supprimer un bar après confirmation
async function handleDeleteBar() {
  if (!barToDelete.value || deleteConfirmationInput.value !== barToDelete.value.name) {
    return
  }
  
  try {
    const { error } = await supabase
      .from('bars')
      .delete()
      .eq('id', barToDelete.value.id)
      .eq('owner_id', session.value.user.id)
    
    if (error) throw error
    
    // Retirer le bar de la liste
    const index = bars.value.findIndex(b => b.id === barToDelete.value.id)
    if (index > -1) {
      bars.value.splice(index, 1)
    }
    
    // Si c'était le bar actif, sélectionner un autre ou retourner à l'écran de sélection
    if (currentBarId.value === barToDelete.value.id) {
      if (bars.value.length > 0) {
        await selectBar(bars.value[0])
      } else {
        bar.value = null
        showBarsSelection.value = false
      }
    }
    
    barToDelete.value = null
    deleteConfirmationInput.value = ''
  } catch (err) {
    console.error('❌ Error deleting bar:', err)
    alert(`${locale.value === 'fr' ? 'Erreur' : 'Error'}: ${err.message}`)
  }
}

// Fonctions d'édition des bars
function startEditBar(bar) {
  editingBarId.value = bar.id
  editingBarName.value = bar.name
  editingBarCode.value = bar.invite_code
}

function cancelEditBar() {
  editingBarId.value = null
  editingBarName.value = ''
  editingBarCode.value = ''
}

async function saveBarEdits(barId) {
  if (!editingBarName.value.trim()) {
    alert(locale.value === 'fr' ? 'Le nom du bar ne peut pas être vide.' : 'Bar name cannot be empty.')
    return
  }
  if (!editingBarCode.value.trim()) {
    alert(locale.value === 'fr' ? 'Le code d\'invitation ne peut pas être vide.' : 'Invite code cannot be empty.')
    return
  }

  updatingBarId.value = barId
  try {
    // Mettre à jour le nom
    if (editingBarName.value !== bars.value.find(b => b.id === barId)?.name) {
      const resultName = await updateBarName(barId, editingBarName.value.trim())
      if (!resultName.success) throw new Error(resultName.error)
    }

    // Mettre à jour le code d'invitation
    if (editingBarCode.value !== bars.value.find(b => b.id === barId)?.invite_code) {
      const resultCode = await updateInviteCode(barId, editingBarCode.value.trim().toUpperCase())
      if (!resultCode.success) throw new Error(resultCode.error)
    }

    cancelEditBar()
  } catch (err) {
    console.error('❌ Error saving bar edits:', err)
    alert(`${locale.value === 'fr' ? 'Erreur' : 'Error'}: ${err.message}`)
  } finally {
    updatingBarId.value = null
  }
}

const showDrinkerPanel  = ref(false)
const drinkerTab        = ref('favorites')
const burgerOpen        = ref(false)

// Initialiser useOrders et écouter les commandes
const { orders, pendingOrdersCount, initOrdersListener, stopOrdersListener } = useOrders()
const showOrdersPanel = ref(false)

// État édition des bars
const editingBarId      = ref(null)
const editingBarName    = ref('')
const editingBarCode    = ref('')
const updatingBarId     = ref(null)
const barStatsMap       = ref({}) // { barId: { cocktails: 0, cards: 0 } }

// Charger les stats d'un bar
async function loadBarStats(barId) {
  if (barStatsMap.value[barId]) return // Cache
  const stats = await getBarStats(barId)
  barStatsMap.value[barId] = stats
}

const favoriteCocktails = computed(() => cocktails.value.filter(c => favorites.value.has(c.id)))
function getCocktailName(id) { return cocktails.value.find(c => c.id === id)?.name ?? '—' }
function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

// UI
const showAuthModal     = ref(false)
const showInventory     = ref(false)
const showFilters       = ref(false)
const showCards         = ref(false)
const showCocktailModal = ref(false)
const showCardModal     = ref(false)
const showCatalogModal = ref(false)
const editingCocktail   = ref(null)
const editingCard       = ref(null)
const viewingCard       = ref(null)
const locale            = ref('fr')

// Rejoindre un bar via code d'invitation (sans compte)
const inviteCodeInput = ref('')
const codeError       = ref('')

// Bars publics affichés sur la page d'accueil
const publicBars      = ref([])
const publicBarsLoading = ref(false)

async function fetchPublicBars() {
  publicBarsLoading.value = true
  const { data, error } = await supabase
    .from('bars')
    .select('id, name, invite_code')
    .eq('is_public', true)
    .order('name')
  if (!error && data) publicBars.value = data
  publicBarsLoading.value = false
}

async function joinPublicBar(bar) {
  inviteCodeInput.value = bar.invite_code
  await joinByCode()
}

// async function joinDemo() {
//   inviteCodeInput.value = 'DEMO-0000'
//   await joinByCode()
// }

async function joinByCode() {
  codeError.value = ''
  const code = inviteCodeInput.value.trim().toUpperCase()
  if (!code) return

  const { data, error } = await supabase
    .from('bars')
    .select('id, name, invite_code')
    .eq('invite_code', code)
    .single()

  if (error || !data) {
    codeError.value = 'Code invalide. Vérifie avec ton bartender.'
    return
  }

  guestBar.value = data
  await Promise.all([
    fetchCocktails(data.id),
    fetchIngredients(data.id),
    fetchMenuCards(data.id),
    initDrinker(data.id),
  ])
  setHash(code)
}

async function onAuthSuccess() {
  clearDrinker()
  if (!currentBarId.value) return
  await Promise.all([
    fetchCocktails(currentBarId.value),
    fetchIngredients(currentBarId.value),
    fetchMenuCards(currentBarId.value),
  ])
}

// Traductions
const t = computed(() => ({
  filterTitle:            locale.value === 'fr' ? '🔍 Filtres'                          : '🔍 Filters',
  cardsTitle:             locale.value === 'fr' ? '📜 Cartes'                           : '📜 Cards',
  bartenderMode:          locale.value === 'fr' ? 'Mode Bartender'                      : 'Bartender Mode',
  drinkerMode:            locale.value === 'fr' ? 'Mode Drinker'                        : 'Drinker Mode',
  newCard:                locale.value === 'fr' ? 'Nouvelle carte'                      : 'New card',
  newCocktail:            locale.value === 'fr' ? 'Nouveau cocktail'                    : 'New cocktail',
  searchPlaceholder:      locale.value === 'fr' ? 'Rechercher un cocktail ou un ingrédient...' : 'Search a cocktail or ingredient...',
  searchPlaceholderShort: locale.value === 'fr' ? 'Rechercher...'                       : 'Search...',
  filterMode:             locale.value === 'fr' ? 'Mode de recherche'                   : 'Search mode',
  filterMain:             locale.value === 'fr' ? '🎯 Ingrédient principal'             : '🎯 Main ingredient',
  filterContains:         locale.value === 'fr' ? '🔍 Contient'                         : '🔍 Contains',
  filterSpirits:          locale.value === 'fr' ? 'Spiritueux de base'                  : 'Base spirits',
  filterLiqueurs:         locale.value === 'fr' ? 'Liqueurs'                            : 'Liqueurs',
  filterSeason:           locale.value === 'fr' ? 'Saison'                              : 'Season',
  filterAvail:            locale.value === 'fr' ? 'Disponibilité'                       : 'Availability',
  filterMakeable:         locale.value === 'fr' ? '🍸 Cocktails réalisables'            : '🍸 Available cocktails',
  filterAbv:              locale.value === 'fr' ? 'Alcool'                              : 'Alcohol',
  clearAll:               locale.value === 'fr' ? 'Effacer tout'                        : 'Clear all',
  noCard:                 locale.value === 'fr' ? 'Aucune carte créée.' : 'No card yet.',
  loading:                locale.value === 'fr' ? 'Chargement des cocktails...'          : 'Loading cocktails...',
  noResult:               locale.value === 'fr' ? 'Aucun cocktail trouvé avec ces critères' : 'No cocktail found',
  stock:                  locale.value === 'fr' ? '📦 Stock du bar'                     : '📦 Bar stock',
  deleteCard:             locale.value === 'fr' ? 'Supprimer cette carte ?'             : 'Delete this card?',
  deleteCocktail:         locale.value === 'fr' ? 'Supprimer ce cocktail ?'             : 'Delete this cocktail?',
  filterProfile:          locale.value === 'fr' ? 'Profil gustatif'                     : 'Flavor profile',
  filterStyle:            locale.value === 'fr' ? 'Style'                                 : 'Style',
}))
// ── Filtres (identique à l'original) ─────────────────────────────────────────
// Utiliser la composable useSearchSuggestions
const { searchInput: searchTerm, showSuggestions: showSearchSuggestions, suggestions } = useSearchSuggestions(cocktails)
// Statistiques des bars
const { getBarStats } = useBarStatistics()

const selectedFamilies   = ref([])
const selectedSubSpirits = ref([])
const selectedSeasons    = ref([])
const showOnlyMakeable   = ref(false)
const showOnlyFavorites  = ref(false)
const filterMode         = ref('main')
const abvFilter          = ref(null)
const selectedProfiles   = ref([])
const selectedStyles     = ref([])
const unit               = ref('oz') // 'oz' ou 'ml'

const baseSpirits = computed(() => [
  { key: 'Whiskey', label: getFL('Whiskey', locale.value), subs: [
    { key: 'bourbon',       label: getFL('bourbon', locale.value)       },
    { key: 'rye',           label: getFL('rye', locale.value)           },
    { key: 'scotch',        label: getFL('scotch', locale.value)        },
    { key: 'irish_whiskey', label: getFL('irish_whiskey', locale.value) },
    { key: 'peated_whisky', label: getFL('peated_whisky', locale.value) },
    { key: 'whiskey',       label: getFL('whiskey', locale.value)       },
  ]},
  { key: 'Rum', label: getFL('Rum', locale.value), subs: [
    { key: 'rum',           label: getFL('rum', locale.value)           },
    { key: 'rum_agricol',   label: getFL('rum_agricol', locale.value)   },
    { key: 'rum_jamaican',  label: getFL('rum_jamaican', locale.value)  },
    { key: 'rum_cuban',     label: getFL('rum_cuban', locale.value)     },
    { key: 'rum_overproof', label: getFL('rum_overproof', locale.value) },
    { key: 'cachaca',       label: getFL('cachaca', locale.value)       },
  ]},
  { key: 'Agave', label: getFL('Agave', locale.value), subs: [
    { key: 'tequila',          label: getFL('tequila', locale.value)          },
    { key: 'tequila_reposado', label: getFL('tequila_reposado', locale.value) },
    { key: 'mezcal',           label: getFL('mezcal', locale.value)           },
  ]},
  { key: 'Gin', label: getFL('Gin', locale.value), subs: [
    { key: 'gin',      label: getFL('gin', locale.value)      },
    { key: 'gin_dry',  label: getFL('gin_dry', locale.value)  },
    { key: 'gin_navy', label: getFL('gin_navy', locale.value) },
    { key: 'genever',  label: getFL('genever', locale.value)  },
  ]},
  { key: 'Brandy', label: getFL('Brandy', locale.value), subs: [
    { key: 'cognac',   label: getFL('cognac', locale.value)   },
    { key: 'calvados', label: getFL('calvados', locale.value) },
    { key: 'pisco',    label: getFL('pisco', locale.value)    },
    { key: 'grappa',   label: getFL('grappa', locale.value)   },
    { key: 'brandy',   label: getFL('brandy', locale.value)   },
  ]},
  { key: 'Vodka',    label: getFL('Vodka', locale.value),    subs: [] },
  { key: 'Absinthe', label: getFL('Absinthe', locale.value), subs: [] },
  { key: 'Aquavit',  label: getFL('Aquavit', locale.value),  subs: [] },
])

const liqueurFamilies = computed(() => [
  { key: 'Liqueur Amer',    label: getFL('Liqueur Amer', locale.value)    },
  { key: 'Liqueur Agrume',  label: getFL('Liqueur Agrume', locale.value)  },
  { key: 'Liqueur Fruits',  label: getFL('Liqueur Fruits', locale.value)  },
  { key: 'Liqueur Herbes',  label: getFL('Liqueur Herbes', locale.value)  },
  { key: 'Liqueur Noix',    label: getFL('Liqueur Noix', locale.value)    },
  { key: 'Liqueur Dessert', label: getFL('Liqueur Dessert', locale.value) },
  { key: 'Liqueur Anisée',  label: getFL('Liqueur Anisée', locale.value)  },
])

const profileFilters = computed(() => {
  const labels = {
    Smoky: locale.value === 'fr' ? 'Fumé' : 'Smoky',
    Bitter: locale.value === 'fr' ? 'Amer' : 'Bitter',
    Creamy: locale.value === 'fr' ? 'Crémeux' : 'Creamy',
    Tropical: locale.value === 'fr' ? 'Tropical' : 'Tropical',
    Floral: locale.value === 'fr' ? 'Floral' : 'Floral',
    Nutty: locale.value === 'fr' ? 'Noisetté' : 'Nutty',
    Spicy: locale.value === 'fr' ? 'Épicé' : 'Spicy',
    Herbal: locale.value === 'fr' ? 'Herbacé' : 'Herbal',
    Fruity: locale.value === 'fr' ? 'Fruité' : 'Fruity',
    Citrus: locale.value === 'fr' ? 'Agrume' : 'Citrus',
    Sour: locale.value === 'fr' ? 'Acidulé' : 'Sour',
    Dry: locale.value === 'fr' ? 'Sec' : 'Dry',
    Boozy: locale.value === 'fr' ? 'Corsé' : 'Boozy',
    Refreshing: locale.value === 'fr' ? 'Frais' : 'Refreshing',
    Rich: locale.value === 'fr' ? 'Riche' : 'Rich',
    Sweet: locale.value === 'fr' ? 'Sucré' : 'Sweet',
  }
  return Object.entries(labels).map(([key, label]) => ({ key, label }))
})

const styleFilters = computed(() => {
  const labels = {
    sour:          locale.value === 'fr' ? '🍋 Sour'          : '🍋 Sour',
    fizz:          locale.value === 'fr' ? '🫧 Fizz'          : '🫧 Fizz',
    highball:      locale.value === 'fr' ? '🥃 Highball'      : '🥃 Highball',
    tiki:          locale.value === 'fr' ? '🌺 Tiki'          : '🌺 Tiki',
    negroni:       locale.value === 'fr' ? '🔴 Negroni'       : '🔴 Negroni',
    old_fashioned: locale.value === 'fr' ? '🟠 Old Fashioned' : '🟠 Old Fashioned',
    classic:       locale.value === 'fr' ? '🎩 Classique'     : '🎩 Classic',
    modern:        locale.value === 'fr' ? '✨ Moderne'        : '✨ Modern',
    creamy:        locale.value === 'fr' ? '🥛 Crémeux'       : '🥛 Creamy',
    flip:          locale.value === 'fr' ? '🥚 Flip'          : '🥚 Flip',
    spritz:        locale.value === 'fr' ? '🍾 Spritz'        : '🍾 Spritz',
  }
  return Object.entries(labels).map(([key, label]) => ({ key, label }))
})

const seasons = computed(() => [
  { key: 'all',    icon: '🍸', label: locale.value === 'fr' ? 'Toutes'    : 'All'    },
  { key: 'spring', icon: '🌸', label: locale.value === 'fr' ? 'Printemps' : 'Spring' },
  { key: 'summer', icon: '☀️', label: locale.value === 'fr' ? 'Été'       : 'Summer' },
  { key: 'fall',   icon: '🍂', label: locale.value === 'fr' ? 'Automne'   : 'Fall'   },
  { key: 'winter', icon: '❄️', label: locale.value === 'fr' ? 'Hiver'     : 'Winter' },
])

const allFamilyLabels = computed(() => Object.fromEntries([
  ...baseSpirits.value.map(s => [s.key, s.label]),
  ...liqueurFamilies.value.map(l => [l.key, l.label]),
]))
const allSubLabels = computed(() => Object.fromEntries(
  baseSpirits.value.flatMap(s => s.subs.map(sub => [sub.key, sub.label]))
))
const activeSubSpirits = computed(() => {
  const subs = []
  for (const family of baseSpirits.value) {
    if (selectedFamilies.value.includes(family.key) && family.subs.length) subs.push(...family.subs)
  }
  return subs
})

function toggleFilter(array, value) {
  const idx = array.indexOf(value)
  if (idx > -1) array.splice(idx, 1)
  else array.push(value)
}
function toggleFamily(familyKey) {
  const isActive = selectedFamilies.value.includes(familyKey)
  toggleFilter(selectedFamilies.value, familyKey)
  if (isActive) {
    const family = baseSpirits.value.find(s => s.key === familyKey)
    if (family?.subs.length) {
      const subKeys = family.subs.map(s => s.key)
      selectedSubSpirits.value = selectedSubSpirits.value.filter(k => !subKeys.includes(k))
    }
  }
}
function clearFilters() {
  selectedFamilies.value = []; selectedSubSpirits.value = []
  selectedSeasons.value  = []; selectedProfiles.value = []
  abvFilter.value = null; showOnlyFavorites.value = false; selectedStyles.value = []
}
function getFamilyLabel(key)    { return allFamilyLabels.value[key] ?? key }
function getSubSpiritLabel(key) { return allSubLabels.value[key] ?? key }
function getSeasonLabel(key) {
  const s = seasons.value.find(s => s.key === key)
  return s ? `${s.icon} ${s.label}` : key
}

const selectedCount = computed(() => barInventory.value.size)
const totalCount    = computed(() => ingredients.value.length)

function isMakeable(cocktail) {
  const recipe = cocktail.recipe || []
  if (!recipe.length) return false
  return recipe.every(ing => ing.Type === 'garnish' || barInventory.value.has(ing.Type))
}
const makeableCount = computed(() => cocktails.value.filter(isMakeable).length)

const filteredCocktails = computed(() => {
  let list = cocktails.value

  if (searchTerm.value.trim()) {
    const s = searchTerm.value.toLowerCase().trim()
    list = list.filter(c =>
      c.name?.toLowerCase().includes(s) ||
      c.recipe?.some(ing => ing.Ingredient?.toLowerCase().includes(s)) ||
      c.creator?.toLowerCase().includes(s) ||
      c.profile?.some(p => p.toLowerCase().includes(s))
    )
  }

  if (selectedFamilies.value.length || selectedSubSpirits.value.length) {
    const activeSubs = selectedSubSpirits.value
    const activeFamilies = selectedFamilies.value
    list = list.filter(c => {
      if (filterMode.value === 'main') {
        const familyMatch = activeFamilies.length === 0 || activeFamilies.includes(c.category)
        const subMatch    = activeSubs.length === 0     || activeSubs.includes(c.base_spirit)
        return familyMatch && subMatch
      } else {
        const recipeTypes = (c.recipe || []).map(ing => ing.Type)
        if (activeSubs.length) return activeSubs.some(sub => recipeTypes.includes(sub))
        return activeFamilies.some(family => {
          const familyDef = baseSpirits.value.find(s => s.key === family)
          if (familyDef) {
            const subKeys    = familyDef.subs.map(s => s.key)
            const genericKey = family.toLowerCase()
            return recipeTypes.some(t => subKeys.includes(t) || t === genericKey)
          }
          return recipeTypes.includes(family.toLowerCase())
        })
      }
    })
  }

  if (selectedSeasons.value.length) {
    list = list.filter(c =>
      Array.isArray(c.season)
        ? c.season.some(s => selectedSeasons.value.includes(s))
        : selectedSeasons.value.includes(c.season)
    )
  }

  if (showOnlyMakeable.value) list = list.filter(isMakeable)

  if (abvFilter.value === 'mocktail') {
    list = list.filter(c => c.abv === 0 || c.abv === null)
  } else if (abvFilter.value === 'low') {
    list = list.filter(c => c.abv !== null && c.abv > 0 && c.abv < 15)
  }

  if (selectedProfiles.value.length) {
    list = list.filter(c => selectedProfiles.value.every(p => c.profile?.includes(p)))
  }

  if (selectedStyles.value.length) {
    list = list.filter(c => selectedStyles.value.includes(c.cocktail_style))
  }

  if (showOnlyFavorites.value && hasDrinker.value) {
    list = list.filter(c => favorites.value.has(c.id))
  }

  return list
})

const hasActiveFilters = computed(() =>
  selectedFamilies.value.length > 0 ||
  selectedSubSpirits.value.length > 0 ||
  selectedSeasons.value.length > 0 ||
  selectedProfiles.value.length > 0 ||
  abvFilter.value !== null ||
  showOnlyFavorites.value ||
  selectedStyles.value.length > 0
)

// ── CRUD menu cards ───────────────────────────────────────────────────────────
function openNewCardModal()      { editingCard.value = null; showCardModal.value = true }
function openEditCardModal(card) { editingCard.value = card; showCardModal.value = true }
async function handleSaveCard(data) {
  if (data.id) await updateMenuCard(data.id, data)
  else         await createMenuCard(data)
  showCardModal.value = false
}
async function handleDeleteCard(id) {
  if (!confirm(t.value.deleteCard)) return
  await deleteMenuCard(id)
}

// ── CRUD cocktails ────────────────────────────────────────────────────────────
function openEditModal(cocktail) { editingCocktail.value = cocktail; showCocktailModal.value = true }
function openNewModal()          { editingCocktail.value = null;      showCocktailModal.value = true }
async function handleSave(data) {
  try {
    if (data.id) {
      const result = await updateCocktail(data.id, data)
      if (!result.success) throw new Error(result.error?.message || 'Erreur lors de la modification')
    } else {
      const result = await createCocktail(data)
      if (!result.success) throw new Error(result.error?.message || 'Erreur lors de la création')
    }
    showCocktailModal.value = false
  } catch (err) {
    console.error('❌ Erreur handleSave:', err)
    alert(`❌ ${err.message}`)
  }
}
async function handleDelete(id) {
  if (!confirm(t.value.deleteCocktail)) return
  await deleteCocktail(id)
}

// Scroll to cocktail card when selected from search suggestions
function scrollToCocktailCard(cocktailId) {
  showSearchSuggestions.value = false
  const element = document.getElementById(`cocktail-${cocktailId}`)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    element.style.animation = 'pulse 0.6s ease'
    setTimeout(() => { element.style.animation = '' }, 600)
  }
}

// ── Deep link via hash ────────────────────────────────────────────────────────
const linkCopied = ref(false)

function copyBarLink() {
  const code = inviteCode.value || guestBar.value?.invite_code
  if (!code) return
  const card = viewingCard.value
  const cardSlug = card ? slugify(card.name) : null
  const url = buildShareUrl(code, cardSlug)
  navigator.clipboard.writeText(url).then(() => {
    linkCopied.value = true
    setTimeout(() => { linkCopied.value = false }, 2000)
  })
}

// Ouvre automatiquement une carte si le slug correspond
function openCardFromSlug(slug) {
  if (!slug || !menuCards.value.length) return
  const match = menuCards.value.find(c => slugify(c.name) === slug)
  if (match) viewingCard.value = match
}

// Lit le hash et charge le bar + éventuellement la carte correspondante
async function handleHashRoute() {
  const { inviteCode: code, cardSlug } = parseHash()
  if (!code) return
  // Ne pas re-charger si déjà sur ce bar
  if (guestBar.value?.invite_code === code || inviteCode.value === code) {
    if (cardSlug) openCardFromSlug(cardSlug)
    return
  }
  inviteCodeInput.value = code
  await joinByCode()
  if (cardSlug) openCardFromSlug(cardSlug)
}

// Sync hash quand on ouvre/ferme une carte
watch(viewingCard, (card) => {
  const code = inviteCode.value || guestBar.value?.invite_code
  if (!code) return
  if (card) {
    setHash(code, slugify(card.name))
  } else {
    setHash(code)
  }
})

// Écouter les commandes en temps réel (bartender mode uniquement)
watch([activeBarId, isLoggedIn], async ([newBarId, newIsLoggedIn]) => {
  if (newIsLoggedIn && newBarId) {
    // Bartender connecté : activer l'écoute des commandes
    await initOrdersListener(newBarId)
  } else {
    // Arrêter l'écoute des commandes
    stopOrdersListener()
  }
})

onMounted(async () => {
  await initAuth()
  await fetchPublicBars()
  await handleHashRoute()
  if (currentBarId.value) {
    await Promise.all([
      fetchCocktails(currentBarId.value),
      fetchIngredients(currentBarId.value),
      fetchMenuCards(currentBarId.value),
      initDrinker(currentBarId.value),
    ])
  }
})

async function handleCatalogImport(newCocktail) {
  // Le cocktail est déjà créé dans useCatalog.importCocktail
  // On l'ajoute simplement à la liste locale
  if (newCocktail) { 
    cocktails.value.push(newCocktail)
    cocktails.value.sort((a, b) => a.name.localeCompare(b.name)) 
  } 
}

const toastMessage = ref('')

const showToast = (message) => {
  toastMessage.value = message

  setTimeout(() => {
    toastMessage.value = ''
  }, 2000)
}
</script>
