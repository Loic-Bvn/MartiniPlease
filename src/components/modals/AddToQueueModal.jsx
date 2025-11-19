

// ============================================
// ADD TO QUEUE MODAL COMPONENT
// ============================================
export const AddToQueueModal = ({ cocktails, profiles, onAdd, onClose }) => {

    const [selectedCocktail, setSelectedCocktail] = useState('');
    const [selectedProfile, setSelectedProfile] = useState('');
    const [quantity, setQuantity] = useState(1);

    const handleAdd = () => {
        if (selectedCocktail && selectedProfile) {
            const cocktail = cocktails.find(c => c.id === selectedCocktail);
            onAdd(cocktail, selectedProfile, quantity);
            setSelectedCocktail('');
            setQuantity(1);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Ajouter à la file</h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
            </button>
            </div>

            <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cocktail</label>
                <select
                value={selectedCocktail}
                onChange={(e) => setSelectedCocktail(e.target.value)}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                <option value="">Sélectionner un cocktail</option>
                {cocktails.map(cocktail => (
                    <option key={cocktail.id} value={cocktail.id}>
                    {cocktail.Name}
                    </option>
                ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pour qui</label>
                <select
                value={selectedProfile}
                onChange={(e) => setSelectedProfile(e.target.value)}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                <option value="">Sélectionner un profil</option>
                {profiles.map(profile => (
                    <option key={profile.id} value={profile.id}>
                    {profile.name}
                    </option>
                ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantité</label>
                <div className="flex items-center gap-2">
                <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                    <Minus size={18} />
                </button>
                <span className="px-4 py-2 font-semibold text-lg">{quantity}</span>
                <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                    <Plus size={18} />
                </button>
                </div>
            </div>

            <button
                onClick={handleAdd}
                disabled={!selectedCocktail || !selectedProfile}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
            >
                Ajouter à la file
            </button>
            </div>
        </div>
        </div>
    );
};
