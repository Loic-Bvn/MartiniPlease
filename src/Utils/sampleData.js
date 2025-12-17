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
export const ingredients = [
    { key: 'all', value: 'Toutes'},
    
    // Spiritueux
    { key: 'absinthe', value: 'Absinthe', category: 'spirits' },
    { key: 'bourbon', value: 'Bourbon', category: 'spirits' },
    { key: 'brandy', value: 'Brandy', category: 'spirits' },
    { key: 'cachaca', value: 'Cachaça', category: 'spirits' },
    { key: 'calvados', value: 'Calvados', category: 'spirits' },
    { key: 'champagne', value: 'Champagne', category: 'spirits' },
    { key: 'cognac', value: 'Cognac', category: 'spirits' },
    { key: 'gin', value: 'Gin', category: 'spirits' },
    { key: 'mezcal', value: 'Mezcal', category: 'spirits' },
    { key: 'rum', value: 'Rhum', category: 'spirits' },
    { key: 'rye', value: 'Rye', category: 'spirits' },
    { key: 'scotch', value: 'Scotch', category: 'spirits' },
    { key: 'tequila', value: 'Tequila', category: 'spirits' },
    { key: 'vodka', value: 'Vodka', category: 'spirits' },
    { key: 'whiskey', value: 'Whisky', category: 'spirits' },
    
    // Liqueurs
    { key: 'allspice', value: 'Allspice', category: 'liqueurs' },
    { key: 'aperol', value: 'Aperol', category: 'liqueurs' },
    { key: 'benedictine', value: 'Bénédictine', category: 'liqueurs' },
    { key: 'campari', value: 'Campari', category: 'liqueurs' },
    { key: 'chartreuse_yellow', value: 'Chartreuse Jaune', category: 'liqueurs' },
    { key: 'chartreuse_green', value: 'Chartreuse Verte', category: 'liqueurs' },
    { key: 'cointreau', value: 'Cointreau', category: 'liqueurs' },
    { key: 'curacao', value: 'Curacao', category: 'liqueurs' },
    { key: 'coffee_licor', value: 'Liqueur Café', category: 'liqueurs' },
    { key: 'licor_43', value: 'Liqueur 43', category: 'liqueurs' },
    { key: 'triple_sec', value: 'Triple sec', category: 'liqueurs' },
    { key: 'sambuca', value: 'Sambuca', category: 'liqueurs' },
    { key: 'baileys', value: 'Baileys', category: 'liqueurs' },
    { key: 'falernum', value: 'Falernum', category: 'liqueurs' },

    // Modificateurs
    { key: 'dry_vermouth', value: 'Vermouth sec', category: 'modifiers' },
    { key: 'sweet_vermouth', value: 'Vermouth doux', category: 'modifiers' },

    // Jus
    { key: 'cranberry_juice', value: 'Jus de cranberry', category: 'juices' },
    { key: 'grapefruit_juice', value: 'Jus de pamplemousse', category: 'juices' },
    { key: 'lemon_juice', value: 'Jus de citron', category: 'juices' },
    { key: 'lime_juice', value: 'Jus de lime', category: 'juices' },
    { key: 'orange_juice', value: "Jus d'orange", category: 'juices' },
    { key: 'pineapple_juice', value: 'Jus d\'ananas', category: 'juices' },

    // Sirops
    { key: 'cinnamon_syrup', value: 'Sirop cannelle', category: 'syrups' },
    { key: 'coconut_cream', value: 'Crème de coco', category: 'syrups' },
    { key: 'grenadine', value: 'Grenadine', category: 'syrups' },
    { key: 'honey_syrup', value: 'Sirop de miel', category: 'syrups' },
    { key: 'maple_syrup', value: 'Sirop d\'érable', category: 'syrups' },
    { key: 'orgeat', value: 'Orgeat', category: 'syrups' },
    { key: 'passion_fruit_syrup', value: 'Sirop passion', category: 'syrups' },
    { key: 'simple_syrup', value: 'Sirop simple', category: 'syrups' },
    { key: 'vanilla_syrup', value: 'Sirop vanille', category: 'syrups' },

    // Bitters
    { key: 'angostura_bitters', value: 'Angostura bitters', category: 'bitters' },
    { key: 'cocoa_bitters', value: 'Cocoa bitters', category: 'bitters' },
    { key: 'orange_bitters', value: 'Orange bitters', category: 'bitters' },
    { key: 'peychaud_bitters', value: 'Peychaud bitters', category: 'bitters' },

    // Mixers
    { key: 'club_soda', value: 'Eau gazeuse', category: 'mixers' },
    { key: 'tonic_water', value: 'Eau tonique', category: 'mixers' },
    { key: 'cola', value: 'Cola', category: 'mixers' },
    { key: 'ginger_beer', value: 'Ginger beer', category: 'mixers' },
];