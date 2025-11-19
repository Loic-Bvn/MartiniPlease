// ============================================
// ORDER QUEUE MODAL COMPONENT
// ============================================
export const OrderQueueModal = ({ orderQueue, onComplete, onClose, profiles }) => {
    const groupedOrders = orderQueue.reduce((acc, order) => {
        const key = `${order.cocktailId}-${order.profileId}`;
        if (!acc[key]) {
            acc[key] = { ...order, count: 0 };
        }
        acc[key].count++;
        return acc;
    }, {});

    const ordersArray = Object.values(groupedOrders);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <ChefHat className="text-orange-600" size={24} />
                File d'attente ({orderQueue.length})
            </h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
            </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-3">
            {ordersArray.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                <p>Aucune commande en attente</p>
                </div>
            ) : (
                ordersArray.map((order, idx) => {
                const profile = profiles.find(p => p.id === order.profileId);
                return (
                    <div key={idx} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg text-gray-800">{order.cocktailName}</h3>
                        {order.count > 1 && (
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-800 text-sm font-semibold rounded">
                            x{order.count}
                            </span>
                        )}
                        </div>
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                        <User size={14} />
                        {profile?.name || 'Inconnu'}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <Clock size={12} />
                        {new Date(order.timestamp).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                        </p>
                    </div>
                    <button
                        onClick={() => onComplete(order)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                    >
                        <Check size={18} />
                        Servir
                    </button>
                    </div>
                );
                })
            )}
            </div>
        </div>
        </div>
    );
};
