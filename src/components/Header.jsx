import { Wine, Search, Menu, ChefHat, Unlock, Lock } from 'lucide-react';

export const Header = ({
    appMode,
    setAppMode,
    currentProfile,
    profiles,
    orderQueue,
    setShowProfileModal,
    setShowOrderQueueModal,
    setShowFilters,
    searchTerm,
    setSearchTerm,
}) => {
    const currentProfileData = profiles.find(p => p.id === currentProfile);

    return (
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

                {/* File d'attente (mode Bartender) */}
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

                {/* Bouton menu mobile */}
                <button
                onClick={() => setShowFilters(prev => !prev)}
                className="md:hidden p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
                >
                <Menu size={24} />
                </button>
            </div>
            </div>

            {/* Barre de recherche */}
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
    );
};
