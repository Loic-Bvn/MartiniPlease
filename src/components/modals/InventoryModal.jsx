// ============================================
// INVENTORY MODAL COMPONENT
// ============================================
export const InventoryModal = ({ allIngredients, barInventory, onToggle, onClear, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Package className="text-blue-600" size={24} />
                Inventaire du bar
            </h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
            </button>
            </div>

            <div className="mb-4 flex gap-2">
            <button
                onClick={() => {
                allIngredients.forEach(ing => {
                    if (!barInventory.has(ing)) onToggle(ing);
                });
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
            >
                Tout sélectionner
            </button>
            <button
                onClick={onClear}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
            >
                Tout vider
            </button>
            <div className="flex-1 text-right text-sm text-gray-600 flex items-center justify-end">
                {barInventory.size} / {allIngredients.length} ingrédients
            </div>
            </div>

            <div className="overflow-y-auto flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {allIngredients.map(ingredient => (
                <button
                    key={ingredient}
                    onClick={() => onToggle(ingredient)}
                    className={`p-3 rounded-lg text-left transition-colors ${
                    barInventory.has(ingredient)
                        ? 'bg-green-50 border-2 border-green-500 text-green-900'
                        : 'bg-gray-50 border-2 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                >
                    <div className="flex items-center justify-between">
                    <span className="font-medium">{ingredient}</span>
                    {barInventory.has(ingredient) && (
                        <span className="text-green-600">✓</span>
                    )}
                    </div>
                </button>
                ))}
            </div>
            </div>
        </div>
        </div>
    );
};
