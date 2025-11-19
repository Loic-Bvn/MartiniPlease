
// ============================================
// PROFILE MODAL COMPONENT
// ============================================

import { User, Users, UserPlus, Trash2, X } from 'lucide-react';

export const ProfileModal = ({ profiles, currentProfile, onClose, onCreate, onSelect, onDelete }) => {
    const [newProfileName, setNewProfileName] = useState('');

    const handleCreate = () => {
        if (newProfileName.trim()) {
            onCreate(newProfileName.trim());
            setNewProfileName('');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Users className="text-blue-600" size={24} />
                Gestion des profils
            </h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
            </button>
            </div>

            <div className="space-y-4">
            <div className="flex gap-2">
                <input
                type="text"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
                placeholder="Nom du nouveau profil..."
                className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button
                onClick={handleCreate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                <UserPlus size={20} />
                </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
                {profiles.map(profile => (
                <div key={profile.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                    <User size={18} className="text-gray-600" />
                    <span className="font-medium">{profile.name}</span>
                    {currentProfile === profile.id && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">Actif</span>
                    )}
                    </div>
                    <div className="flex gap-2">
                    {currentProfile !== profile.id && (
                        <button
                        onClick={() => onSelect(profile.id)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                        Sélectionner
                        </button>
                    )}
                    <button
                        onClick={() => onDelete(profile.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                        <Trash2 size={16} />
                    </button>
                    </div>
                </div>
                ))}
            </div>

            {profiles.length === 0 && (
                <p className="text-center text-gray-500 text-sm py-4">Aucun profil créé</p>
            )}
            </div>
        </div>
        </div>
    );
};