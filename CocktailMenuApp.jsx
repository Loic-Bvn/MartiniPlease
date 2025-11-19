
// ============================================
// MAIN APP COMPONENT
// ============================================

import { useAppContext } from './context/AppContext';
import { Header } from './components/Header';
import { CocktailCard } from './components/CocktailCard';
import { ProfileModal } from './components/modals/ProfileModal';

export const CocktailMenuApp = () => {
    // Mode et authentification
    const [appMode, setAppMode] = useState('bartender');
    const [currentProfile, setCurrentProfile] = useState(null);
    const [profiles, setProfiles] = useState([]);

    // Données cocktails
    const [cocktails, setCocktails] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSpirit, setSelectedSpirit] = useState('all');
    const [selectedSeason, setSelectedSeason] = useState('all');
    const [showAvailableOnly, setShowAvailableOnly] = useState(false);
    const [hiddenCocktails, setHiddenCocktails] = useState(new Set());

    // Inventaire bar
    const [barInventory, setBarInventory] = useState(new Set());
    const [allIngredients, setAllIngredients] = useState([]);

    // Données utilisateur
    const [favorites, setFavorites] = useState(new Set());
    const [userRatings, setUserRatings] = useState({});
    const [userNotes, setUserNotes] = useState({});
    const [orderHistory, setOrderHistory] = useState([]);

    // File d'attente
    const [orderQueue, setOrderQueue] = useState([]);

    // UI
    const [showFilters, setShowFilters] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showInventoryModal, setShowInventoryModal] = useState(false);
    const [showOrderQueueModal, setShowOrderQueueModal] = useState(false);
    const [showAddToQueueModal, setShowAddToQueueModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const fileInputRef = useRef(null);

    // Initialisation
    useEffect(() => {
        setProfiles(Storage.getProfiles());
        setBarInventory(Storage.getBarInventory());
        setHiddenCocktails(Storage.getHiddenCocktails());
        setSelectedSeason(Storage.getSeasonFilter());
        setOrderQueue(Storage.getOrderQueue());
        
        const savedData = Storage.getCocktailData();
        if (savedData) {
        loadCocktails(savedData);
        } else {
        loadCocktails(sampleData);
        }
    }, []);

    // Charger les données du profil
    useEffect(() => {
        if (currentProfile) {
        setFavorites(Storage.getProfileData(currentProfile, 'favorites'));
        setUserRatings(Storage.getProfileData(currentProfile, 'ratings'));
        setUserNotes(Storage.getProfileData(currentProfile, 'notes'));
        setOrderHistory(Storage.getProfileData(currentProfile, 'history'));
        }
    }, [currentProfile]);

    // Charger les cocktails
    const loadCocktails = (data) => {
        const allCocktails = [];
        Object.entries(data).forEach(([family, spirits]) => {
        Object.entries(spirits).forEach(([spiritType, cocktailList]) => {
            cocktailList.forEach(cocktail => {
            allCocktails.push({
                ...cocktail,
                family,
                spiritType,
                id: `${family}-${spiritType}-${cocktail.Name}`,
                Season: cocktail.Season || 'all'
            });
            });
        });
        });
        setCocktails(allCocktails);

        const ingredientsSet = new Set();
        allCocktails.forEach(cocktail => {
        cocktail.Recipe.forEach(ing => {
            if (ing.Type !== 'garnish') {
            ingredientsSet.add(ing.Ingredient);
            }
        });
        });
        setAllIngredients(Array.from(ingredientsSet).sort());
    };

    // Gestion des profils
    const createProfile = (name) => {
        const newProfile = {
        id: Date.now().toString(),
        name,
        createdAt: new Date().toISOString()
        };

        const updatedProfiles = [...profiles, newProfile];
        setProfiles(updatedProfiles);
        Storage.saveProfiles(updatedProfiles);
        setCurrentProfile(newProfile.id);
        setShowProfileModal(false);
    };

    const deleteProfile = (profileId) => {
        if (confirm('Supprimer ce profil et toutes ses données ?')) {
        const updatedProfiles = profiles.filter(p => p.id !== profileId);
        setProfiles(updatedProfiles);
        Storage.saveProfiles(updatedProfiles);
        
        ['favorites', 'ratings', 'notes', 'history'].forEach(key => {
            localStorage.removeItem(`profile_${profileId}_${key}`);
        });
        
        if (currentProfile === profileId) {
            setCurrentProfile(null);
            setFavorites(new Set());
            setUserRatings({});
            setUserNotes({});
            setOrderHistory([]);
        }
        }
    };

    // Gestion de l'inventaire
    const toggleIngredient = (ingredient) => {
        const newInventory = new Set(barInventory);
        if (newInventory.has(ingredient)) {
            newInventory.delete(ingredient);
        } else {
            newInventory.add(ingredient);
        }
        setBarInventory(newInventory);
        Storage.saveBarInventory(newInventory);
    };

    const clearInventory = () => {
        if (confirm('Vider tout l\'inventaire du bar ?')) {
            setBarInventory(new Set());
            Storage.saveBarInventory(new Set());
        }
    };

    // Actions utilisateur
    const toggleFavorite = (cocktailId) => {
        if (!currentProfile) return;

        const newFavorites = new Set(favorites);
        if (newFavorites.has(cocktailId)) {
            newFavorites.delete(cocktailId);
        } else {
            newFavorites.add(cocktailId);
        }
        setFavorites(newFavorites);
        Storage.saveProfileData(currentProfile, 'favorites', newFavorites);
    };

    const setRating = (cocktailId, rating) => {
        if (!currentProfile) return;

        const newRatings = { ...userRatings, [cocktailId]: rating };
        setUserRatings(newRatings);
        Storage.saveProfileData(currentProfile, 'ratings', newRatings);
    };

    const saveNote = (cocktailId, note) => {
        if (!currentProfile) return;

        const newNotes = { ...userNotes, [cocktailId]: note };
        setUserNotes(newNotes);
        Storage.saveProfileData(currentProfile, 'notes', newNotes);
    };

    const orderCocktail = (cocktail) => {
        if (!currentProfile) return;

        const order = {
            cocktailId: cocktail.id,
            cocktailName: cocktail.Name,
            profileId: currentProfile,
            timestamp: new Date().toISOString()
        };

        const newHistory = [order, ...orderHistory];
        setOrderHistory(newHistory);
        Storage.saveProfileData(currentProfile, 'history', newHistory);

        const newQueue = [...orderQueue, order];
        setOrderQueue(newQueue);
        Storage.saveOrderQueue(newQueue);
    };

    // Gestion de la file d'attente
    const completeOrder = (order) => {
        const newQueue = [...orderQueue];
        const index = newQueue.findIndex(o => 
        o.cocktailId === order.cocktailId && 
        o.profileId === order.profileId
        );

        if (index !== -1) {
            newQueue.splice(index, 1);
            setOrderQueue(newQueue);
            Storage.saveOrderQueue(newQueue);
        }
    };

    const addToQueue = (cocktail, profileId, quantity) => {
        const orders = Array(quantity).fill(null).map(() => ({
            cocktailId: cocktail.id,
            cocktailName: cocktail.Name,
            profileId,
            timestamp: new Date().toISOString()
        }));
        
        const newQueue = [...orderQueue, ...orders];
        setOrderQueue(newQueue);
        Storage.saveOrderQueue(newQueue);
        setShowAddToQueueModal(false);
    };

    // Gestion du masquage des cocktails
    const toggleHiddenCocktail = (cocktailId) => {
        const newHidden = new Set(hiddenCocktails);
        if (newHidden.has(cocktailId)) {
            newHidden.delete(cocktailId);
        } else {
            newHidden.add(cocktailId);
        }
        setHiddenCocktails(newHidden);
        Storage.saveHiddenCocktails(newHidden);
    };

    // Changement de saison
    const handleSeasonChange = (season) => {
        setSelectedSeason(season);
        Storage.saveSeasonFilter(season);
    };

    // Upload fichier
    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (file.type !== 'application/json') {
            setUploadError('Le fichier doit être au format JSON');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
        try {
            const jsonData = JSON.parse(e.target.result);

            if (typeof jsonData !== 'object' || jsonData === null) {
                throw new Error('Structure JSON invalide');
            }

            Storage.saveCocktailData(jsonData);
            loadCocktails(jsonData);
            setShowUploadModal(false);
            setUploadError('');
            
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error) {
            setUploadError(`Erreur: ${error.message}`);
        }
        };

        reader.readAsText(file);
    };

    // Filtrage
    const filteredCocktails = cocktails.filter(cocktail => {
        // En mode drinker, masquer les cocktails cachés
        if (appMode === 'drinker' && hiddenCocktails.has(cocktail.id)) {
            return false;
        }

        const matchesSearch = cocktail.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            cocktail.Recipe.some(ing => ing.Ingredient.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesSpirit = selectedSpirit === 'all' || cocktail.family === selectedSpirit;
        const matchesSeason = selectedSeason === 'all' || cocktail.Season === 'all' || cocktail.Season === selectedSeason;
        const matchesAvailability = !showAvailableOnly || cocktail.Recipe.every(ing => 
        ing.Type === 'garnish' || barInventory.has(ing.Ingredient)
        );

        return matchesSearch && matchesSpirit && matchesSeason && matchesAvailability;
    });

    const spiritFamilies = [...new Set(cocktails.map(c => c.family))];
    const currentProfileData = profiles.find(p => p.id === currentProfile);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Modals */}
        {showProfileModal && (
            <ProfileModal
            profiles={profiles}
            currentProfile={currentProfile}
            onClose={() => setShowProfileModal(false)}
            onCreate={createProfile}
            onSelect={(id) => {
                setCurrentProfile(id);
                setShowProfileModal(false);
            }}
            onDelete={deleteProfile}
            />
        )}

        {showInventoryModal && (
            <InventoryModal
            allIngredients={allIngredients}
            barInventory={barInventory}
            onToggle={toggleIngredient}
            onClear={clearInventory}
            onClose={() => setShowInventoryModal(false)}
            />
        )}

        {showOrderQueueModal && (
            <OrderQueueModal
            orderQueue={orderQueue}
            profiles={profiles}
            onComplete={completeOrder}
            onClose={() => setShowOrderQueueModal(false)}
            />
        )}

        {showAddToQueueModal && (
            <AddToQueueModal
            cocktails={cocktails}
            profiles={profiles}
            onAdd={addToQueue}
            onClose={() => setShowAddToQueueModal(false)}
            />
        )}

        {/* Upload Modal */}
        {showUploadModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <FileJson className="text-blue-600" size={24} />
                    Importer des données
                </h2>
                <button onClick={() => setShowUploadModal(false)} className="p-1 hover:bg-gray-100 rounded">
                    <X size={20} />
                </button>
                </div>

                <div className="space-y-4">
                <p className="text-gray-600 text-sm">
                    Importe ton fichier JSON de cocktails
                </p>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                    <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                    <p className="text-sm text-gray-600">Clique pour sélectionner</p>
                    <p className="text-xs text-gray-400 mt-1">Format JSON uniquement</p>
                    </label>
                </div>

                {uploadError && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
                    <p className="text-sm text-red-800">{uploadError}</p>
                    </div>
                )}

                <div className="pt-4 border-t">
                    <button
                    onClick={() => {
                        loadCocktails(sampleData);
                        setShowUploadModal(false);
                        localStorage.removeItem('cocktail_data');
                    }}
                    className="w-full py-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                    Utiliser les données d'exemple
                    </button>
                </div>
                </div>
            </div>
            </div>
        )}

        {/* Header */}
        <div className="bg-white shadow-md sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                <Wine className="text-blue-600" size={32} />
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Mon Home Bar</h1>
                    <p className="text-sm text-gray-500">
                    <span className={`font-semibold ${appMode === 'bartender' ? 'text-orange-600' : 'text-purple-600'}`}>
                        {appMode === 'bartender' ? '🍸 Bartender' : '🍹 Drinker'}
                    </span>
                    {currentProfileData && ` • ${currentProfileData.name}`}
                    </p>
                </div>
                </div>
                
                <div className="flex items-center gap-2">
                {/* Bouton changement de mode */}
                <button
                    onClick={() => setAppMode(appMode === 'bartender' ? 'drinker' : 'bartender')}
                    className={`hidden md:flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors ${
                    appMode === 'bartender' 
                        ? 'bg-purple-600 hover:bg-purple-700' 
                        : 'bg-orange-600 hover:bg-orange-700'
                    }`}
                >
                    {appMode === 'bartender' ? <Unlock size={18} /> : <Lock size={18} />}
                    <span>Mode {appMode === 'bartender' ? 'Drinker' : 'Bartender'}</span>
                </button>

                {/* File d'attente */}
                {appMode === 'bartender' && orderQueue.length > 0 && (
                    <button
                    onClick={() => setShowOrderQueueModal(true)}
                    className="relative px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                    >
                    <ChefHat size={18} />
                    <span className="hidden md:inline">File d'attente</span>
                    <span className="absolute -top-2 -right-2 bg-yellow-400 text-gray-900 text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                        {orderQueue.length}
                    </span>
                    </button>
                )}

                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="md:hidden p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
                >
                    <Menu size={24} />
                </button>
                </div>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                type="text"
                placeholder="Rechercher un cocktail ou un ingrédient..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>
            </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row gap-6">
            {/* Sidebar */}
            <div className={`${showFilters ? 'block' : 'hidden'} md:block w-full md:w-64 space-y-4`}>
                {/* Profil actif */}
                {appMode === 'drinker' && (
                <div className="bg-white rounded-lg shadow-md p-4">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <User size={18} />
                    Profil
                    </h3>
                    {currentProfileData ? (
                    <div className="space-y-3">
                        <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="font-medium text-blue-900">{currentProfileData.name}</p>
                        <p className="text-xs text-blue-600 mt-1">
                            {orderHistory.length} cocktail{orderHistory.length > 1 ? 's' : ''} commandé{orderHistory.length > 1 ? 's' : ''}
                        </p>
                        </div>
                        <button
                        onClick={() => {
                            setCurrentProfile(null);
                            setFavorites(new Set());
                            setUserRatings({});
                            setUserNotes({});
                            setOrderHistory([]);
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                        >
                        <LogOut size={16} />
                        Se déconnecter
                        </button>
                    </div>
                    ) : (
                    <div className="text-center py-4">
                        <p className="text-sm text-gray-500 mb-3">Aucun profil sélectionné</p>
                        <button
                        onClick={() => setShowProfileModal(true)}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                        Sélectionner un profil
                        </button>
                    </div>
                    )}
                </div>
                )}

                {/* Gestion Bartender */}
                {appMode === 'bartender' && (
                <div className="bg-white rounded-lg shadow-md p-4 space-y-3">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Package size={18} />
                    Gestion Bar
                    </h3>
                    <button
                    onClick={() => setShowInventoryModal(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                    <ShoppingCart size={16} />
                    Gérer l'inventaire
                    </button>
                    <button
                    onClick={() => setShowProfileModal(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                    <Users size={16} />
                    Gérer les profils
                    </button>
                    <button
                    onClick={() => setShowAddToQueueModal(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                    >
                    <Plus size={16} />
                    Ajouter à la file
                    </button>
                    <button
                    onClick={() => setShowUploadModal(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                    <Upload size={16} />
                    Importer JSON
                    </button>
                    <div className="pt-3 border-t">
                    <p className="text-xs text-gray-500 mb-2">Inventaire:</p>
                    <p className="text-sm font-semibold text-gray-700">
                        {barInventory.size} / {allIngredients.length}
                    </p>
                    </div>
                </div>
                )}

                {/* Filtres */}
                <div className="bg-white rounded-lg shadow-md p-4">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Filter size={18} />
                    Filtres
                </h3>

                <div className="space-y-4">
                    <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                        type="checkbox"
                        checked={showAvailableOnly}
                        onChange={(e) => setShowAvailableOnly(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">
                        Disponibles uniquement
                        </span>
                    </label>
                    </div>

                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Famille d'alcool
                    </label>
                    <select
                        value={selectedSpirit}
                        onChange={(e) => setSelectedSpirit(e.target.value)}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">Tous</option>
                        {spiritFamilies.map(family => (
                        <option key={family} value={family}>
                            {family.replace('_', ' ')}
                        </option>
                        ))}
                    </select>
                    </div>

                    {appMode === 'bartender' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                        Saison
                        </label>
                        <select
                        value={selectedSeason}
                        onChange={(e) => handleSeasonChange(e.target.value)}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                        <option value="all">Toutes saisons</option>
                        <option value="spring">Printemps</option>
                        <option value="summer">Été</option>
                        <option value="fall">Automne</option>
                        <option value="winter">Hiver</option>
                        </select>
                    </div>
                    )}

                    <button
                    onClick={() => {
                        setSelectedSpirit('all');
                        setSelectedSeason('all');
                        setSearchTerm('');
                        setShowAvailableOnly(false);
                    }}
                    className="w-full py-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                    Réinitialiser
                    </button>
                </div>
                </div>

                {/* Stats */}
                <div className="bg-white rounded-lg shadow-md p-4">
                <h3 className="font-semibold text-gray-800 mb-3">Statistiques</h3>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-semibold">{cocktails.length}</span>
                    </div>
                    <div className="flex justify-between">
                    <span className="text-gray-600">Disponibles:</span>
                    <span className="font-semibold text-green-600">
                        {cocktails.filter(c => c.Recipe.every(ing => 
                        ing.Type === 'garnish' || barInventory.has(ing.Ingredient)
                        )).length}
                    </span>
                    </div>
                    <div className="flex justify-between">
                    <span className="text-gray-600">Affichés:</span>
                    <span className="font-semibold">{filteredCocktails.length}</span>
                    </div>
                    {currentProfile && (
                    <>
                        <div className="flex justify-between pt-2 border-t">
                        <span className="text-gray-600">Favoris:</span>
                        <span className="font-semibold">{favorites.size}</span>
                        </div>
                        <div className="flex justify-between">
                        <span className="text-gray-600">Commandés:</span>
                        <span className="font-semibold">{orderHistory.length}</span>
                        </div>
                    </>
                    )}
                </div>
                </div>

                {/* Historique */}
                {appMode === 'drinker' && currentProfile && orderHistory.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-4">
                    <h3 className="font-semibold text-gray-800 mb-3">Dernières commandes</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                    {orderHistory.slice(0, 10).map((order, idx) => (
                        <div key={idx} className="text-sm p-2 bg-gray-50 rounded">
                        <p className="font-medium text-gray-700">{order.cocktailName}</p>
                        <p className="text-xs text-gray-500">
                            {new Date(order.timestamp).toLocaleString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                            })}
                        </p>
                        </div>
                    ))}
                    </div>
                </div>
                )}
            </div>

            {/* Cocktails Grid */}
            <div className="flex-1">
                <div className="mb-4 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-700">
                    {filteredCocktails.length} cocktail{filteredCocktails.length > 1 ? 's' : ''}
                </h2>
                </div>

                {filteredCocktails.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                    <p className="text-gray-500 text-lg">Aucun cocktail trouvé</p>
                    <p className="text-gray-400 text-sm mt-2">Modifie tes filtres</p>
                </div>
                ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCocktails.map(cocktail => (
                    <CocktailCard
                        key={cocktail.id}
                        cocktail={cocktail}
                        appMode={appMode}
                        currentProfile={currentProfile}
                        barInventory={barInventory}
                        favorites={favorites}
                        userRatings={userRatings}
                        userNotes={userNotes}
                        isHidden={hiddenCocktails.has(cocktail.id)}
                        onToggleFavorite={toggleFavorite}
                        onSetRating={setRating}
                        onSaveNote={saveNote}
                        onOrder={orderCocktail}
                        onToggleHidden={toggleHiddenCocktail}
                    />
                    ))}
                </div>
                )}
            </div>
            </div>
        </div>
        </div>
    );
};

export default CocktailMenuApp;Modal, setShowInventory