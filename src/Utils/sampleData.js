// import cocktailData from '../Utils/cocktail_sample.json';
import cocktailData from '../Utils/cocktail_dump_15_12_2025.json';

export const cocktailsData = cocktailData;

export const spirit_categories = [
    { key: '', value: "Tous" },
    { key: 'whiskey', value: "Whisky" },
    { key: 'rum', value: "Rhum" },
    { key: 'gin', value: "Gin" },
    { key: 'vodka', value: "Vodka" },
    { key: 'agave', value: "Agave" },
    { key: 'brandy', value: "Brandy" },
    { key: 'liqueur', value: "Liqueur" },
];

// subcategories mapping by category
export const spirit_subcategories = {
    whiskey: [
        { key: 'bourbon', value: 'Bourbon' },
        { key: 'scotch', value: 'Scotch' },
        { key: 'rye', value: 'Rye' },
    ],
    rum: [
        { key: 'rum', value: 'Rhum' },
        { key: 'cachaca', value: 'Cachaça' },
    ],
    gin: [
        { key: 'gin', value: 'Gin' },
    ],
    vodka: [
        { key: 'vodka', value: 'Vodka' },
    ],
    agave: [
        { key: 'tequila', value: 'Tequila' },
        { key: 'mezcal', value: 'Mezcal' },
    ],
    brandy: [
        { key: 'calvados', value: 'Calvados' },
        { key: 'cognac', value: 'Cognac' },
    ],
    liqueur: [
        { key: 'liqueur', value: 'Liqueur' },
        { key: 'benedictine', value: 'Bénédictine' },
        { key: 'chartreuse', value: 'Chartreuse' },
    ],
};

export const seasons = [
    { key: 'all', value: 'Toutes', icon: '🌍' },
    { key: 'spring', value: 'Printemps', icon: '🌸' },
    { key: 'summer', value: 'Été', icon: '☀️' },
    { key: 'autumn', value: 'Automne', icon: '🍂' },
    { key: 'winter', value: 'Hiver', icon: '❄️' },
];