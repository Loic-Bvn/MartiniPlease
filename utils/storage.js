

// ============================================
// STORAGE UTILITIES
// ============================================
const Storage = {
    getProfiles: () => {
        const saved = localStorage.getItem('bar_profiles');
        return saved ? JSON.parse(saved) : [];
    },
    
    saveProfiles: (profiles) => {
        localStorage.setItem('bar_profiles', JSON.stringify(profiles));
    },
    
    getBarInventory: () => {
        const saved = localStorage.getItem('bar_inventory');
        return saved ? new Set(JSON.parse(saved)) : new Set();
    },
    
    saveBarInventory: (inventory) => {
        localStorage.setItem('bar_inventory', JSON.stringify([...inventory]));
    },
    
    getProfileData: (profileId, key) => {
        const saved = localStorage.getItem(`profile_${profileId}_${key}`);
        if (key === 'favorites') return saved ? new Set(JSON.parse(saved)) : new Set();
        return saved ? JSON.parse(saved) : (key === 'history' ? [] : {});
    },
    
    saveProfileData: (profileId, key, data) => {
        const value = data instanceof Set ? [...data] : data;
        localStorage.setItem(`profile_${profileId}_${key}`, JSON.stringify(value));
    },
    
    getCocktailData: () => {
        const saved = localStorage.getItem('cocktail_data');
        return saved ? JSON.parse(saved) : null;
    },
    
    saveCocktailData: (data) => {
        localStorage.setItem('cocktail_data', JSON.stringify(data));
    },
    
    getHiddenCocktails: () => {
        const saved = localStorage.getItem('hidden_cocktails');
        return saved ? new Set(JSON.parse(saved)) : new Set();
    },
    
    saveHiddenCocktails: (hidden) => {
        localStorage.setItem('hidden_cocktails', JSON.stringify([...hidden]));
    },
    
    getSeasonFilter: () => {
        return localStorage.getItem('season_filter') || 'all';
    },
    
    saveSeasonFilter: (season) => {
        localStorage.setItem('season_filter', season);
    },
    
    getOrderQueue: () => {
        const saved = localStorage.getItem('order_queue');
        return saved ? JSON.parse(saved) : [];
    },
    
    saveOrderQueue: (queue) => {
        localStorage.setItem('order_queue', JSON.stringify(queue));
    }
};