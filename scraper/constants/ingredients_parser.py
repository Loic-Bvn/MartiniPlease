"""
Règles de détection des types d'ingrédients
"""
from typing import List, Tuple, Callable

# IMPORTANT : ordre critique — du plus spécifique au plus générique
INGREDIENT_RULES: List[Tuple[str, Callable[[str], bool]]] = [
    # ── Spiritueux ─────────────────────────────────────────────────
    # Whiskey : spécifiques avant génériques
    ('irish_whiskey',    lambda x: ('irish' in x) and ('whiskey' in x or 'whisky' in x)),
    ('peated_whisky',    lambda x: ('peat' in x or 'islay' in x) and ('whisky' in x or 'whiskey' in x or 'scotch' in x)),
    ('bourbon',          lambda x: 'bourbon' in x),
    ('rye',              lambda x: 'rye whiskey' in x or 'rye whisky' in x or ('rye' in x and 'bread' not in x)),
    ('scotch',           lambda x: 'scotch' in x or ('whisky' in x and 'japanese' not in x and 'irish' not in x)),
    ('whiskey',          lambda x: 'whiskey' in x),

    # Rum : spécifiques avant génériques
    ('rum_agricol',      lambda x: 'rhum agricole' in x or ('agricole' in x and ('rum' in x or 'rhum' in x))),
    ('rum_cuban',        lambda x: ('cuban' in x or 'cubano' in x) and ('rum' in x or 'ron' in x)),
    ('rum_jamaican',     lambda x: ('jamaican' in x or 'appleton' in x) and 'rum' in x),
    ('rum_overproof',    lambda x: ('overproof' in x or '151' in x) and ('rum' in x or 'rhum' in x)),
    ('rum',              lambda x: any(w in x for w in ['rum', 'rhum', 'ron']) and 'frond' not in x),
    ('cachaca',          lambda x: 'cachaca' in x or 'cachaça' in x),

    # Tequila / Mezcal
    ('tequila_reposado', lambda x: 'reposado' in x),
    ('tequila',          lambda x: 'tequila' in x),
    ('mezcal',           lambda x: 'mezcal' in x or 'mescal' in x),

    # Gin : spécifiques avant génériques
    ('gin_navy',         lambda x: 'navy' in x and 'gin' in x),
    ('gin_dry',          lambda x: 'dry gin' in x and 'ginger' not in x),
    ('genever',          lambda x: 'genever' in x or 'jenever' in x or 'genièvre' in x),
    ('gin',              lambda x: 'gin' in x and 'ginger' not in x and 'beijing' not in x),

    # Brandy / Cognac
    ('calvados',         lambda x: 'calvados' in x or 'apple brandy' in x or 'applejack' in x),
    ('cognac',           lambda x: 'cognac' in x),
    ('pisco',            lambda x: 'pisco' in x),
    ('grappa',           lambda x: 'grappa' in x),
    ('brandy',           lambda x: 'brandy' in x),

    # Autres spiritueux
    ('absinthe',         lambda x: 'absinthe' in x),
    ('pastis',           lambda x: 'pastis' in x or 'ricard' in x),
    ('vodka',            lambda x: 'vodka' in x),
    ('aquavit',          lambda x: 'aquavit' in x or 'akvavit' in x),

    # ── Liqueurs ───────────────────────────────────────────────────
    # Amers italiens
    ('aperol',           lambda x: 'aperol' in x),
    ('campari',          lambda x: 'campari' in x),
    ('cynar',            lambda x: 'cynar' in x),
    ('fernet_branca',    lambda x: 'fernet' in x),
    ('amaro',            lambda x: 'amaro' in x),

    # Liqueurs de plantes / herbes
    ('chartreuse_green', lambda x: 'chartreuse' in x and ('green' in x or 'verte' in x)),
    ('chartreuse_yellow',lambda x: 'chartreuse' in x and ('yellow' in x or 'jaune' in x)),
    ('benedictine',      lambda x: 'benedictine' in x or ('bene' in x and 'dom' in x)),
    ('galliano',         lambda x: 'galliano' in x),
    ('suze',             lambda x: 'suze' in x),
    ('allspice',         lambda x: 'allspice dram' in x or 'pimento dram' in x),
    ('pimms',            lambda x: 'pimm' in x),

    # Liqueurs d'agrumes
    ('triple_sec',       lambda x: 'triple sec' in x or 'cointreau' in x),
    ('curacao',          lambda x: 'curacao' in x or 'curaçao' in x or 'grand marnier' in x or 'marnier' in x),
    ('limoncello',       lambda x: 'limoncello' in x),
    ('italicus',         lambda x: 'italicus' in x),

    # Liqueurs de fruits
    ('cherry_heering',   lambda x: 'cherry heering' in x or ('cherry' in x and 'heering' in x)),
    ('maraschino',       lambda x: 'maraschino' in x),
    ('apricot_licor',    lambda x: ('apricot' in x or 'abricot' in x) and ('liqueur' in x or 'brandy' in x or 'licor' in x or 'giffard' in x)),
    ('cassis_licor',     lambda x: 'creme de cassis' in x or ('cassis' in x and ('liqueur' in x or 'creme' in x))),
    ('mure_licor',       lambda x: 'creme de mure' in x or 'mure' in x or ('blackberry' in x and 'liqueur' in x)),
    ('banana_licor',     lambda x: 'creme de banane' in x or (('banana' in x or 'banane' in x) and ('liqueur' in x or 'licor' in x))),
    ('mint_licor',       lambda x: 'creme de menthe' in x or ('mint' in x and 'liqueur' in x)),
    ('chocolate_licor',  lambda x: 'creme de cacao' in x or ('chocolate' in x and 'liqueur' in x)),
    ('midori',           lambda x: 'midori' in x),
    ('sloe_gin',         lambda x: 'sloe' in x and 'gin' in x),
    ('mango_licor',      lambda x: 'mango' in x and ('liqueur' in x or 'licor' in x)),
    ('peach_licor',      lambda x: 'peach' in x and ('liqueur' in x or 'licor' in x)),
    ('pear_licor',       lambda x: 'pear' in x and ('liqueur' in x or 'licor' in x or 'creme' in x)),
    ('pit_licor',        lambda x: 'noyaux' in x and ('liqueur' in x or 'licor' in x or 'creme' in x)),

    # Liqueurs de noix / café / crème
    ('amaretto',         lambda x: 'amaretto' in x),
    ('frangelico',       lambda x: 'frangelico' in x),
    ('coffee_licor',     lambda x: ('kahlua' in x or 'tia maria' in x) or ('coffee' in x and 'liqueur' in x)),
    ('baileys',          lambda x: 'baileys' in x or 'irish cream' in x),
    ('licor_43',         lambda x: 'licor 43' in x or 'liquor 43' in x),
    ('walnut_licor',     lambda x: 'walnut' in x and ('liquor' in x or 'liqueur' in x)),

    # Divers
    ('elderflower_licor',lambda x: 'elderflower' in x and ('liqueur' in x or 'cordial' in x or 'st germain' in x)),
    ('violet_licor'     ,lambda x: 'violette' in x and ('liqueur' in x or 'creme' in x or 'licor' in x)),
    ('sambuca',          lambda x: 'sambuca' in x),
    ('drambuie',         lambda x: 'drambuie' in x),
    ('falernum',         lambda x: 'falernum' in x),
    ('swedish_punsch',   lambda x: 'swedish punsch' in x),
    ('malort',           lambda x: 'malort' in x),

    # ── Modificateurs / vins fortifiés ────────────────────────────
    ('blanc_vermouth',   lambda x: 'vermouth' in x and ('blanc' in x or 'bianco' in x)),
    ('dry_vermouth',     lambda x: 'vermouth' in x and ('dry' in x or 'extra dry' in x)),
    ('sweet_vermouth',   lambda x: 'vermouth' in x and ('sweet' in x or 'rosso' in x or 'rouge' in x or 'cocchi')),
    ('lillet',           lambda x: 'lillet' in x),
    ('cocchi_americano', lambda x: 'cocchi' in x and 'americano' in x),
    ('sherry',           lambda x: 'sherry' in x or 'xerez' in x or 'fino' in x or 'oloroso' in x or 'amontillado' in x),
    ('porto',            lambda x: 'porto' in x or 'port wine' in x or ('port' in x and ('ruby' in x or 'tawny' in x))),
    ('sparkling_wine',   lambda x: any(w in x for w in ['champagne', 'prosecco', 'cava', 'cremant', 'crémant', 'sparkling wine'])),
    ('sake',             lambda x: 'sake' in x or 'saké' in x),
    ('beer',             lambda x: 'beer' in x and 'ginger' not in x and 'root' not in x),
    ('ipa_beer',         lambda x: 'ipa' in x),
    ('stout_beer',       lambda x: 'stout' in x or 'guinness' in x),
    ('red_wine',         lambda x: 'red wine' in x or 'vin rouge' in x),
    ('dry_white_wine',   lambda x: 'white wine' in x or 'vin blanc' in x), # dry as default white wine
    ('sweet_white_wine', lambda x: ('white wine' in x or 'vin blanc' in x) and 'sweet' in x),
    ('rose_wine',        lambda x: 'rose wine' in x or 'rosé wine' in x or 'vin rose' in x),

    # ── Jus ───────────────────────────────────────────────────────
    ('cranberry_juice',  lambda x: 'cranberry' in x and 'juice' in x),
    ('grapefruit_juice', lambda x: 'grapefruit' in x and 'juice' in x),
    ('lemon_juice',      lambda x: 'lemon juice' in x),
    ('lime_juice',       lambda x: 'lime juice' in x),
    ('orange_juice',     lambda x: 'orange juice' in x),
    ('pineapple_juice',  lambda x: 'pineapple' in x and 'juice' in x),
    ('apple_juice',      lambda x: 'apple juice' in x or 'apple cider' in x),
    ('passion_juice',    lambda x: 'passion' in x and 'juice' in x),
    ('tomato_juice',     lambda x: 'tomato' in x and 'juice' in x),

    # ── Sirops ────────────────────────────────────────────────────
    ('honey_syrup',          lambda x: 'honey' in x and ('syrup' in x or 'mix' in x)),
    ('agave_syrup',          lambda x: 'agave' in x and ('syrup' in x or 'nectar' in x)),
    ('cinnamon_syrup',       lambda x: 'cinnamon' in x and 'syrup' in x),
    ('passion_fruit_syrup',  lambda x: 'passion fruit' in x and 'syrup' in x),
    ('raspberry_syrup',      lambda x: 'raspberry' in x and 'syrup' in x),
    ('vanilla_syrup',        lambda x: 'vanilla' in x and 'syrup' in x),
    ('maple_syrup',          lambda x: 'maple syrup' in x or 'sirop d\'erable' in x),
    ('demerara_syrup',       lambda x: 'demerara' in x and 'syrup' in x),
    ('coconut_syrup',        lambda x: 'cream of coconut' in x or ('coconut syrup' in x)),
    ('orgeat',               lambda x: 'orgeat' in x or 'almond syrup' in x),
    ('grenadine',            lambda x: 'grenadine' in x),
    ('rich_simple_syrup',    lambda x: 'rich simple syrup' in x or ('rich' in x and 'syrup' in x)),
    ('semi_simple_syrup',    lambda x: 'semi' in x and 'syrup' in x),
    ('simple_syrup',         lambda x: 'simple syrup' in x or 'sugar syrup' in x or 'gomme' in x),
    ('guava_syrup',          lambda x: 'syrup' in x and 'guava' in x),
    ('ginger_syrup',         lambda x: 'syrup' in x and 'ginger' in x),
    ('hibiscus_syrup',       lambda x: 'syrup' in x and 'hibiscus' in x),
    ('redcurrant_syrup',     lambda x: 'groseille' in x and 'syrup' in x),

    # ── Bitters ───────────────────────────────────────────────────
    ('angostura_bitters',    lambda x: 'angostura' in x),
    ('peychaud_bitters',     lambda x: 'peychaud' in x),
    ('orange_bitters',       lambda x: 'orange bitters' in x),
    ('chocolate_bitters',    lambda x: 'chocolate bitters' in x or 'mole bitters' in x),
    ('celery_bitters',       lambda x: 'celery bitters' in x),
    ('walnut_bitters',       lambda x: 'walnut bitters' in x),
    ('bitters',              lambda x: 'bitters' in x or 'bitter' in x),

    # ── Mixers ────────────────────────────────────────────────────
    ('ginger_soda',          lambda x: 'ginger' in x and ('beer' in x or 'ale' in x or 'brew' in x)),
    ('tonic_water',          lambda x: 'tonic' in x),
    ('cola',                 lambda x: 'cola' in x and 'chocolate' not in x),
    ('club_soda',            lambda x: any(p in x for p in ['soda water', 'sparkling water', 'sparkling mineral water', 'club soda', 'eau gazeuse'])),
    ('coconut_cream',        lambda x: 'coconut cream' in x and 'syrup' not in x),

    # ── Garnish ───────────────────────────────────────────────────
    ('lemon_swath',      lambda x: 'lemon' in x and 'swath' in x),
    ('lime_swath',       lambda x: 'lime' in x and 'swath' in x),
    ('orange_swath',     lambda x: 'orange' in x and 'swath' in x),
    ('grapefruit_swath', lambda x: 'grapefruit' in x and 'swath' in x),
    ('lemon_zest',       lambda x: 'lemon' in x and ('zest' in x or 'twist' in x or 'peel' in x or 'oil' in x)),
    ('lime_zest',        lambda x: 'lime' in x and ('zest' in x or 'twist' in x or 'peel' in x  or 'oil' in x)),
    ('orange_zest',      lambda x: 'orange' in x and ('zest' in x or 'twist' in x or 'peel' in x  or 'oil' in x)),
    ('grapefruit_zest',  lambda x: 'grapefruit' in x and ('zest' in x or 'twist' in x or 'peel' in x or 'oil' in x)),
    ('cocktail_cherry',  lambda x: 'cherry' in x and 'heering' not in x and 'liqueur' not in x),
    ('olive',            lambda x: 'olive' in x and 'oil' not in x),
    ('lime_wheel',       lambda x: 'lime' in x and 'wheel' in x),
    ('nutmeg',           lambda x: 'nutmeg' in x or 'muscade' in x),
    ('mint',             lambda x: 'mint' in x and 'liqueur' not in x and 'creme de' not in x),
    ('cucumber',         lambda x: 'cucumber' in x),
    ('strawberry',       lambda x: ('strawberry' in x or 'strawberries' in x) and 'liqueur' not in x and 'syrup' not in x),
    ('celery',           lambda x: 'celery' in x and 'bitter' not in x),
    ('salt',             lambda x: 'salt' in x and ('rim' in x or 'pinch' in x or 'flake' in x)),
    ('sugar_rim',        lambda x: 'sugar' in x and 'rim' in x),
    ('dried_fruit',      lambda x: 'dried fruit' in x or 'dehydrated' in x),
    ('cinnamon_stick',   lambda x: 'cinnamon' in x and 'stick' in x),
    ('grape',            lambda x: 'grape' in x and not 'grapefruit' in x),

    # ── Autres / dairy / divers ───────────────────────────────────
    ('worcestershire',   lambda x: 'worcestershire' in x),
    ('hot_sauce',        lambda x: 'hot sauce' in x or 'tabasco' in x),
    ('cold_brew',        lambda x: 'cold brew' in x),
    ('matcha',           lambda x: 'matcha' in x),
    ('butter',           lambda x: 'butter' in x),
    ('heavy_cream',      lambda x: 'heavy cream' in x or 'double cream' in x or 'whipping cream' in x or ('half' in x and 'half in x') or ('1/2' in x and '1/2' in x) or 'creamer' in x),
    ('aquafaba',         lambda x: 'egg white' in x or 'aquafaba' in x),
    ('egg',              lambda x: 'whole egg' in x or ('egg' in x and 'nog' not in x)),
    ('milk',             lambda x: 'milk' in x),
    ('coffee',           lambda x: 'coffee' in x and 'liqueur' not in x or 'espresso' in x),
    ('tea',              lambda x: 'tea' in x and 'peach' not in x),
    ('water',            lambda x: 'water' in x and 'hot' not in x and 'sparkling' not in x),
    ('hot_water',        lambda x: 'hot water' in x),
]