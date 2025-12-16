import { ref } from 'vue';

const barInventory = ref(new Set());

export function useInventory() {
function toggleIngredient(ingredient) {
    if (barInventory.value.has(ingredient)) {
    barInventory.value.delete(ingredient);
    } else {
    barInventory.value.add(ingredient);
    }
    barInventory.value = new Set(barInventory.value);
}

function hasIngredient(ingredient) {
    return barInventory.value.has(ingredient);
}

function clearInventory() {
    barInventory.value.clear();
}

function addMultiple(ingredients) {
ingredients.forEach(ing => barInventory.value.add(ing));
barInventory.value = new Set(barInventory.value);
}

return {
    barInventory,
    toggleIngredient,
    hasIngredient,
    clearInventory,
    addMultiple
};
}