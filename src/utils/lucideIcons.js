import {
  AlertTriangle,
  Barrel,
  BookOpen,
  ChartNoAxesCombined,
  Check,
  Cherry,
  Citrus,
  CupSoda,
  Droplet,
  FlaskConical,
  Flower2,
  GlassWater,
  Globe,
  Grape,
  Leaf,
  LoaderCircle,
  LockKeyhole,
  LogIn,
  Martini,
  Package,
  Palmtree,
  Pipette,
  Search,
  Snowflake,
  Sprout,
  Star,
  Sun,
  UserRound,
  Wheat,
  Wine,
} from 'lucide-vue-next'

export const lucideIcons = {
  alert: AlertTriangle,
  bartender: Martini,
  cards: BookOpen,
  check: Check,
  cocktail: Martini,
  drinker: GlassWater,
  filters: Search,
  globe: Globe,
  loading: LoaderCircle,
  lock: LockKeyhole,
  stock: Package,
  orders: Martini,
  login: LogIn,
  profile: UserRound,
  trends: ChartNoAxesCombined,
}

// Catégories d'ingrédients (stock, formulaire d'ajout)
export const categoryIcons = {
  spirits: Barrel,
  licors: Wine,
  modifiers: FlaskConical,
  juices: Citrus,
  syrups: Droplet,
  bitters: Pipette,
  mixers: CupSoda,
  garnish: Cherry,
  others: Package,
}

// Saisons des cocktails
export const seasonIcons = {
  spring: Flower2,
  summer: Sun,
  fall: Leaf,
  winter: Snowflake,
}

// Familles de spiritueux (groupes du menu)
export const spiritIcons = {
  whiskey: Barrel,
  rum: Palmtree,
  agave: Sun,
  gin: Leaf,
  vodka: Snowflake,
  brandy: Grape,
  absinthe: Sprout,
  aquavit: Wheat,
  pastis: Star,
  mocktail: CupSoda,
  others: Martini,
}
