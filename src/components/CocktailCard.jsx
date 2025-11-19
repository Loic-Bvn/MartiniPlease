
// ============================================
// COCKTAIL CARD COMPONENT
// ============================================
import { Star, ChevronDown, ChevronUp } from 'lucide-react';

export const CocktailCard = ({ 
    cocktail, 
    appMode,
    currentProfile,
    barInventory, 
    favorites, 
    userRatings, 
    userNotes,
    isHidden,
    onToggleFavorite, 
    onSetRating, 
    onSaveNote, 
    onOrder,
    onToggleHidden
    }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const isFavorite = favorites.has(cocktail.id);
    const rating = userRatings[cocktail.id] || 0;
    const note = userNotes[cocktail.id] || '';
    
    const available = cocktail.Recipe.every(ing => 
        ing.Type === 'garnish' || barInventory.has(ing.Ingredient)
    );
    
    const missingIngs = cocktail.Recipe.filter(ing => 
        ing.Type !== 'garnish' && !barInventory.has(ing.Ingredient)
    );

    return (
        <div className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all ${
        !available ? 'opacity-60' : ''
        } ${isHidden ? 'ring-2 ring-red-300' : ''}`}>
        {cocktail.Image && (
            <div className="h-48 overflow-hidden bg-gray-200">
            <img 
                src={cocktail.Image} 
                alt={cocktail.Name}
                className="w-full h-full object-cover"
                onError={(e) => e.target.style.display = 'none'}
            />
            </div>
        )}
        
        <div className="p-6">
            <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
                <h3 className={`text-xl font-bold ${available ? 'text-gray-800' : 'text-gray-400'}`}>
                {cocktail.Name}
                </h3>
                {!available && (
                <p className="text-xs text-red-600 mt-1">
                    Manque {missingIngs.length} ingrédient{missingIngs.length > 1 ? 's' : ''}
                </p>
                )}
                {isHidden && (
                <p className="text-xs text-red-600 mt-1">Masqué en mode Drinker</p>
                )}
            </div>
            {currentProfile && appMode === 'drinker' && (
                <button
                onClick={() => onToggleFavorite(cocktail.id)}
                className={`p-2 rounded-full transition-colors ${
                    isFavorite ? 'text-yellow-500 bg-yellow-50' : 'text-gray-400 hover:text-yellow-500 hover:bg-gray-50'
                }`}
                >
                <Star size={20} fill={isFavorite ? 'currentColor' : 'none'} />
                </button>
            )}
            </div>

            <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                {cocktail.spiritType}
            </span>
            <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                {cocktail.family.replace('_', ' ')}
            </span>
            {cocktail.Season && (
                <span className="px-3 py-1 bg-pink-100 text-pink-800 text-sm rounded-full">
                {cocktail.Season}
                </span>
            )}
            {available && (
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                ✓ Disponible
                </span>
            )}
            </div>

            {currentProfile && appMode === 'drinker' && (
            <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map(star => (
                <button
                    key={star}
                    onClick={() => onSetRating(cocktail.id, star)}
                    className={`${star <= rating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400 transition-colors`}
                >
                    <Star size={18} fill={star <= rating ? 'currentColor' : 'none'} />
                </button>
                ))}
            </div>
            )}

            {appMode === 'bartender' && (
            <button
                onClick={() => onToggleHidden(cocktail.id)}
                className={`w-full mb-3 py-2 rounded-lg font-medium text-sm ${
                isHidden 
                    ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
                {isHidden ? 'Afficher en mode Drinker' : 'Masquer en mode Drinker'}
            </button>
            )}

            <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between text-blue-600 hover:text-blue-800 font-medium mb-3"
            >
            <span>Voir la recette</span>
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            {isExpanded && (
            <div className="border-t pt-4 space-y-4">
                <div className="space-y-2">
                <h4 className="font-semibold text-gray-700">Ingrédients:</h4>
                {cocktail.Recipe.map((ing, idx) => {
                    const hasIngredient = ing.Type === 'garnish' || barInventory.has(ing.Ingredient);
                    return (
                    <div 
                        key={idx} 
                        className={`flex justify-between text-sm ${
                        !hasIngredient ? 'text-gray-400 line-through' : 'text-gray-700'
                        }`}
                    >
                        <span>{ing.Ingredient}</span>
                        <span className="text-gray-500">
                        {ing.Oz && `${ing.Oz} oz`}
                        {ing.Ml && ` (${ing.Ml} ml)`}
                        </span>
                    </div>
                    );
                })}
                </div>

                {appMode === 'drinker' && currentProfile && available && (
                <button
                    onClick={() => onOrder(cocktail)}
                    className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                    Commander ce cocktail
                </button>
                )}

                {currentProfile && appMode === 'drinker' && (
                <div className="space-y-2">
                    <h4 className="font-semibold text-gray-700">Notes personnelles:</h4>
                    <textarea
                    value={note}
                    onChange={(e) => onSaveNote(cocktail.id, e.target.value)}
                    placeholder="Ajoute tes notes, modifications, commentaires..."
                    className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    />
                </div>
                )}
            </div>
            )}
        </div>
        </div>
    );
};