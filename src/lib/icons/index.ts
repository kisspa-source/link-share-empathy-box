import { 
  // Basic icons
  Folder, 
  FolderOpen,
  Heart, 
  Star, 
  Home, 
  Book,
  Camera,
  Music,
  Video,
  Image,
  Code,
  Settings,
  User,
  Users,
  Calendar,
  Clock,
  Bell,
  Mail,
  Phone,
  Map,
  ShoppingCart,
  CreditCard,
  Briefcase,
  GraduationCap,

  Palette,
  Coffee,
  Car,
  Plane,
  Flower,
  Sun,
  Moon,
  Cloud,
  Zap,
  Shield,
  Key,
  Lock,
  Unlock,
  Gift,
  Trophy,
  Target,
  Rocket,
  Lightbulb,
  Bookmark,
  FileText,
  Archive,
  Database,
  Download,
  Upload,
  Share,
  Link,
  Globe,
  Wifi,
  Smartphone,
  Laptop,
  Monitor,
  Headphones,
  Mic,
  Speaker,
  Search,
  Flag,
  Tag,
  Hash,
  AtSign,
  Percent,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  PieChart,
  Circle,
  Square,
  Triangle,
  Hexagon,
  Diamond,
  Sparkles,
  Flame,
  Snowflake,
  Droplets,
  Leaf,
  Bug,
  Fish,
  Bird,
  Rabbit,
  Cat,
  Dog,
  Turtle,
  Apple,
  Pizza,
  Cake,
  Utensils,

  Wine,
  // 의료 관련 아이콘들은 제거하고 대신 일반적인 아이콘 사용
  MapPin,
  Compass,
  Luggage,
  Tent,
  Mountain,
  Waves,
  Calculator,
  Ruler,
  Anchor,
  // Weather icons
  Umbrella,
  // Building icons
  Building,
  Building2,
  Store,
  Church,
  Hospital,
  School,

  // Transport icons
  Train,
  Bus,
  Truck,
  Ship,
  Bike,
  // Sports icons
  Dumbbell,
  // Games icons - 기본 아이콘만 사용
  // Fashion icons
  Shirt,
  Crown,
  Gem,
  Watch
} from 'lucide-react';

export interface IconInfo {
  name: string;
  icon: typeof Folder;
  category: string;
  keywords: string[];
  label: string;
}

// 아이콘 카테고리 정의
export const iconCategories = {
  default: 'Default',
  work: 'Work',
  home: 'Home',
  entertainment: 'Entertainment',
  education: 'Education',
  health: 'Health',
  travel: 'Travel',
  food: 'Food',
  nature: 'Nature',
  animals: 'Animals',
  technology: 'Technology',
  fashion: 'Fashion',
  sports: 'Sports',
  finance: 'Finance',
  weather: 'Weather',
  buildings: 'Buildings',
  transport: 'Transport',
  symbols: 'Symbols',
  shapes: 'Shapes',
  holidays: 'Holidays',
  games: 'Games'
} as const;

export type IconCategory = keyof typeof iconCategories;

// 아이콘 데이터 정의
export const iconData: IconInfo[] = [
  // Default 카테고리
  { name: 'folder', icon: Folder, category: 'default', keywords: ['folder', 'directory', 'file'], label: 'Folder' },
  { name: 'folder-open', icon: FolderOpen, category: 'default', keywords: ['folder', 'open', 'directory'], label: 'Open Folder' },
  { name: 'bookmark', icon: Bookmark, category: 'default', keywords: ['bookmark', 'save', 'favorite'], label: 'Bookmark' },
  { name: 'star', icon: Star, category: 'default', keywords: ['star', 'favorite', 'important'], label: 'Star' },
  { name: 'heart', icon: Heart, category: 'default', keywords: ['heart', 'love', 'like'], label: 'Heart' },
  
  // Work 카테고리
  { name: 'briefcase', icon: Briefcase, category: 'work', keywords: ['work', 'job', 'business'], label: 'Briefcase' },
  { name: 'code', icon: Code, category: 'work', keywords: ['code', 'programming', 'development'], label: 'Code' },
  { name: 'settings', icon: Settings, category: 'work', keywords: ['settings', 'configuration', 'tools'], label: 'Settings' },
  { name: 'database', icon: Database, category: 'work', keywords: ['database', 'storage', 'data'], label: 'Database' },
  { name: 'monitor', icon: Monitor, category: 'work', keywords: ['monitor', 'computer', 'screen'], label: 'Monitor' },
  { name: 'laptop', icon: Laptop, category: 'work', keywords: ['laptop', 'computer', 'work'], label: 'Laptop' },
  { name: 'smartphone', icon: Smartphone, category: 'work', keywords: ['phone', 'mobile', 'smartphone'], label: 'Smartphone' },
  
  // Home 카테고리
  { name: 'home', icon: Home, category: 'home', keywords: ['home', 'house', 'family'], label: 'Home' },
  { name: 'user', icon: User, category: 'home', keywords: ['user', 'person', 'profile'], label: 'User' },
  { name: 'users', icon: Users, category: 'home', keywords: ['users', 'people', 'family'], label: 'Users' },
  { name: 'calendar', icon: Calendar, category: 'home', keywords: ['calendar', 'date', 'schedule'], label: 'Calendar' },
  { name: 'clock', icon: Clock, category: 'home', keywords: ['time', 'clock', 'schedule'], label: 'Clock' },
  { name: 'bell', icon: Bell, category: 'home', keywords: ['notification', 'alert', 'reminder'], label: 'Bell' },
  { name: 'mail', icon: Mail, category: 'home', keywords: ['email', 'message', 'communication'], label: 'Mail' },
  { name: 'phone', icon: Phone, category: 'home', keywords: ['phone', 'call', 'contact'], label: 'Phone' },
  
  // Entertainment 카테고리
  { name: 'music', icon: Music, category: 'entertainment', keywords: ['music', 'song', 'audio'], label: 'Music' },
  { name: 'video', icon: Video, category: 'entertainment', keywords: ['video', 'movie', 'film'], label: 'Video' },
  { name: 'camera', icon: Camera, category: 'entertainment', keywords: ['camera', 'photo', 'picture'], label: 'Camera' },
  { name: 'image', icon: Image, category: 'entertainment', keywords: ['image', 'photo', 'picture'], label: 'Image' },

  { name: 'palette', icon: Palette, category: 'entertainment', keywords: ['art', 'color', 'design'], label: 'Palette' },
  { name: 'headphones', icon: Headphones, category: 'entertainment', keywords: ['headphones', 'music', 'audio'], label: 'Headphones' },
  { name: 'mic', icon: Mic, category: 'entertainment', keywords: ['microphone', 'voice', 'recording'], label: 'Microphone' },
  { name: 'speaker', icon: Speaker, category: 'entertainment', keywords: ['speaker', 'audio', 'sound'], label: 'Speaker' },
  
  // Education 카테고리
  { name: 'book', icon: Book, category: 'education', keywords: ['book', 'read', 'study'], label: 'Book' },
  { name: 'graduation-cap', icon: GraduationCap, category: 'education', keywords: ['education', 'school', 'university'], label: 'Graduation Cap' },
  { name: 'lightbulb', icon: Lightbulb, category: 'education', keywords: ['idea', 'innovation', 'creativity'], label: 'Light Bulb' },
  { name: 'file-text', icon: FileText, category: 'education', keywords: ['document', 'text', 'file'], label: 'Document' },
  { name: 'calculator', icon: Calculator, category: 'education', keywords: ['calculator', 'math', 'numbers'], label: 'Calculator' },
  { name: 'ruler', icon: Ruler, category: 'education', keywords: ['ruler', 'measure', 'geometry'], label: 'Ruler' },
  
  // Health 카테고리
  { name: 'activity', icon: Activity, category: 'health', keywords: ['fitness', 'exercise', 'health'], label: 'Activity' },
  { name: 'heart-health', icon: Heart, category: 'health', keywords: ['heart', 'health', 'medical'], label: 'Heart' },
  
  // Travel 카테고리
  { name: 'map', icon: Map, category: 'travel', keywords: ['map', 'location', 'navigation'], label: 'Map' },
  { name: 'map-pin', icon: MapPin, category: 'travel', keywords: ['location', 'pin', 'place'], label: 'Location Pin' },
  { name: 'compass', icon: Compass, category: 'travel', keywords: ['compass', 'direction', 'navigation'], label: 'Compass' },
  { name: 'luggage', icon: Luggage, category: 'travel', keywords: ['luggage', 'suitcase', 'travel'], label: 'Luggage' },
  { name: 'tent', icon: Tent, category: 'travel', keywords: ['tent', 'camping', 'outdoor'], label: 'Tent' },
  { name: 'mountain', icon: Mountain, category: 'travel', keywords: ['mountain', 'hiking', 'outdoor'], label: 'Mountain' },
  { name: 'waves', icon: Waves, category: 'travel', keywords: ['waves', 'ocean', 'beach'], label: 'Waves' },
  
  // Food 카테고리
  { name: 'coffee', icon: Coffee, category: 'food', keywords: ['coffee', 'drink', 'beverage'], label: 'Coffee' },
  { name: 'apple', icon: Apple, category: 'food', keywords: ['apple', 'fruit', 'healthy'], label: 'Apple' },
  { name: 'pizza', icon: Pizza, category: 'food', keywords: ['pizza', 'food', 'restaurant'], label: 'Pizza' },
  { name: 'cake', icon: Cake, category: 'food', keywords: ['cake', 'dessert', 'sweet'], label: 'Cake' },
  { name: 'utensils', icon: Utensils, category: 'food', keywords: ['utensils', 'eat', 'restaurant'], label: 'Utensils' },

  { name: 'wine', icon: Wine, category: 'food', keywords: ['wine', 'drink', 'alcohol'], label: 'Wine' },
  
  // Nature 카테고리
  { name: 'flower', icon: Flower, category: 'nature', keywords: ['flower', 'nature', 'garden'], label: 'Flower' },
  { name: 'leaf', icon: Leaf, category: 'nature', keywords: ['leaf', 'nature', 'plant'], label: 'Leaf' },
  { name: 'droplets', icon: Droplets, category: 'nature', keywords: ['water', 'rain', 'drops'], label: 'Water Droplets' },
  { name: 'flame', icon: Flame, category: 'nature', keywords: ['fire', 'flame', 'hot'], label: 'Flame' },
  
  // Animals 카테고리
  { name: 'cat', icon: Cat, category: 'animals', keywords: ['cat', 'pet', 'animal'], label: 'Cat' },
  { name: 'dog', icon: Dog, category: 'animals', keywords: ['dog', 'pet', 'animal'], label: 'Dog' },
  { name: 'fish', icon: Fish, category: 'animals', keywords: ['fish', 'sea', 'animal'], label: 'Fish' },
  { name: 'bird', icon: Bird, category: 'animals', keywords: ['bird', 'fly', 'animal'], label: 'Bird' },
  { name: 'rabbit', icon: Rabbit, category: 'animals', keywords: ['rabbit', 'bunny', 'animal'], label: 'Rabbit' },
  { name: 'turtle', icon: Turtle, category: 'animals', keywords: ['turtle', 'slow', 'animal'], label: 'Turtle' },
  { name: 'bug', icon: Bug, category: 'animals', keywords: ['bug', 'insect', 'animal'], label: 'Bug' },
  
  // Technology 카테고리
  { name: 'wifi', icon: Wifi, category: 'technology', keywords: ['wifi', 'internet', 'network'], label: 'WiFi' },
  { name: 'globe', icon: Globe, category: 'technology', keywords: ['internet', 'global', 'web'], label: 'Globe' },
  { name: 'link', icon: Link, category: 'technology', keywords: ['link', 'url', 'connection'], label: 'Link' },
  { name: 'share', icon: Share, category: 'technology', keywords: ['share', 'social', 'network'], label: 'Share' },
  { name: 'download', icon: Download, category: 'technology', keywords: ['download', 'save', 'file'], label: 'Download' },
  { name: 'upload', icon: Upload, category: 'technology', keywords: ['upload', 'share', 'file'], label: 'Upload' },
  { name: 'search', icon: Search, category: 'technology', keywords: ['search', 'find', 'look'], label: 'Search' },
  { name: 'zap', icon: Zap, category: 'technology', keywords: ['energy', 'power', 'electric'], label: 'Zap' },
  
  // Finance 카테고리
  { name: 'dollar-sign', icon: DollarSign, category: 'finance', keywords: ['money', 'dollar', 'finance'], label: 'Dollar Sign' },
  { name: 'credit-card', icon: CreditCard, category: 'finance', keywords: ['credit', 'card', 'payment'], label: 'Credit Card' },
  { name: 'shopping-cart', icon: ShoppingCart, category: 'finance', keywords: ['shopping', 'cart', 'buy'], label: 'Shopping Cart' },
  { name: 'trending-up', icon: TrendingUp, category: 'finance', keywords: ['growth', 'profit', 'success'], label: 'Trending Up' },
  { name: 'trending-down', icon: TrendingDown, category: 'finance', keywords: ['loss', 'decline', 'down'], label: 'Trending Down' },
  { name: 'pie-chart', icon: PieChart, category: 'finance', keywords: ['chart', 'statistics', 'data'], label: 'Pie Chart' },
  { name: 'bar-chart', icon: BarChart3, category: 'finance', keywords: ['chart', 'statistics', 'data'], label: 'Bar Chart' },
  
  // Weather 카테고리
  { name: 'sun', icon: Sun, category: 'weather', keywords: ['sun', 'sunny', 'weather', 'hot'], label: 'Sun' },
  { name: 'moon', icon: Moon, category: 'weather', keywords: ['moon', 'night', 'weather'], label: 'Moon' },
  { name: 'cloud', icon: Cloud, category: 'weather', keywords: ['cloud', 'cloudy', 'weather'], label: 'Cloud' },
  { name: 'umbrella', icon: Umbrella, category: 'weather', keywords: ['umbrella', 'rain', 'protection'], label: 'Umbrella' },
  { name: 'snowflake', icon: Snowflake, category: 'weather', keywords: ['snowflake', 'snow', 'winter'], label: 'Snowflake' },
  
  // Buildings 카테고리
  { name: 'building', icon: Building, category: 'buildings', keywords: ['building', 'office', 'city'], label: 'Building' },
  { name: 'building2', icon: Building2, category: 'buildings', keywords: ['building', 'apartment', 'city'], label: 'Apartment' },
  { name: 'home-building', icon: Home, category: 'buildings', keywords: ['home', 'house', 'residence'], label: 'House' },
  { name: 'store', icon: Store, category: 'buildings', keywords: ['store', 'shop', 'market'], label: 'Store' },
  { name: 'church', icon: Church, category: 'buildings', keywords: ['church', 'religion', 'worship'], label: 'Church' },
  { name: 'hospital', icon: Hospital, category: 'buildings', keywords: ['hospital', 'medical', 'health'], label: 'Hospital' },
  { name: 'school', icon: School, category: 'buildings', keywords: ['school', 'education', 'learning'], label: 'School' },

  
  // Transport 카테고리
  { name: 'train', icon: Train, category: 'transport', keywords: ['train', 'railway', 'transport'], label: 'Train' },
  { name: 'bus', icon: Bus, category: 'transport', keywords: ['bus', 'public transport', 'vehicle'], label: 'Bus' },
  { name: 'truck', icon: Truck, category: 'transport', keywords: ['truck', 'delivery', 'transport'], label: 'Truck' },
  { name: 'ship', icon: Ship, category: 'transport', keywords: ['ship', 'boat', 'water transport'], label: 'Ship' },
  { name: 'car', icon: Car, category: 'transport', keywords: ['car', 'vehicle', 'transport'], label: 'Car' },
  { name: 'plane', icon: Plane, category: 'transport', keywords: ['airplane', 'flight', 'transport'], label: 'Airplane' },
  { name: 'bike', icon: Bike, category: 'transport', keywords: ['bicycle', 'bike', 'cycling'], label: 'Bicycle' },
  
  // Sports 카테고리
  { name: 'dumbbell', icon: Dumbbell, category: 'sports', keywords: ['dumbbell', 'gym', 'fitness'], label: 'Dumbbell' },
  { name: 'activity-sports', icon: Activity, category: 'sports', keywords: ['activity', 'fitness', 'exercise'], label: 'Activity' },
  { name: 'target-sports', icon: Target, category: 'sports', keywords: ['target', 'archery', 'sports'], label: 'Target' },
  { name: 'trophy-sports', icon: Trophy, category: 'sports', keywords: ['trophy', 'award', 'sports'], label: 'Trophy' },
  
  // Games 카테고리
  { name: 'star-game', icon: Star, category: 'games', keywords: ['star', 'game', 'achievement'], label: 'Star' },
  
  // Holidays 카테고리
  { name: 'gift-holidays', icon: Gift, category: 'holidays', keywords: ['gift', 'present', 'holiday'], label: 'Gift' },
  { name: 'cake-holidays', icon: Cake, category: 'holidays', keywords: ['cake', 'birthday', 'celebration'], label: 'Birthday Cake' },
  { name: 'heart-holidays', icon: Heart, category: 'holidays', keywords: ['heart', 'love', 'valentine'], label: 'Valentine Heart' },
  { name: 'star-holidays', icon: Star, category: 'holidays', keywords: ['star', 'christmas', 'decoration'], label: 'Christmas Star' },
  { name: 'star-christmas', icon: Star, category: 'holidays', keywords: ['star', 'christmas', 'holiday'], label: 'Christmas Star' },
  { name: 'sparkles-holidays', icon: Sparkles, category: 'holidays', keywords: ['sparkles', 'magic', 'celebration'], label: 'Sparkles' },
  
  // Fashion 카테고리
  { name: 'shirt-fashion', icon: Shirt, category: 'fashion', keywords: ['shirt', 'clothing', 'fashion'], label: 'Shirt' },
  { name: 'crown-fashion', icon: Crown, category: 'fashion', keywords: ['crown', 'royal', 'fashion'], label: 'Crown' },
  { name: 'gem-fashion', icon: Gem, category: 'fashion', keywords: ['gem', 'jewelry', 'fashion'], label: 'Gem' },

  { name: 'watch-fashion', icon: Watch, category: 'fashion', keywords: ['watch', 'time', 'fashion'], label: 'Watch' },
  
  // Symbols 카테고리
  { name: 'shield', icon: Shield, category: 'symbols', keywords: ['security', 'protection', 'safe'], label: 'Shield' },
  { name: 'key', icon: Key, category: 'symbols', keywords: ['key', 'password', 'access'], label: 'Key' },
  { name: 'lock', icon: Lock, category: 'symbols', keywords: ['lock', 'secure', 'private'], label: 'Lock' },
  { name: 'unlock', icon: Unlock, category: 'symbols', keywords: ['unlock', 'open', 'access'], label: 'Unlock' },
  { name: 'rocket', icon: Rocket, category: 'symbols', keywords: ['rocket', 'launch', 'space'], label: 'Rocket' },
  { name: 'flag', icon: Flag, category: 'symbols', keywords: ['flag', 'country', 'mark'], label: 'Flag' },
  { name: 'tag', icon: Tag, category: 'symbols', keywords: ['tag', 'label', 'category'], label: 'Tag' },
  { name: 'hash', icon: Hash, category: 'symbols', keywords: ['hash', 'number', 'symbol'], label: 'Hash' },
  { name: 'at-sign', icon: AtSign, category: 'symbols', keywords: ['at', 'email', 'symbol'], label: 'At Sign' },
  { name: 'percent', icon: Percent, category: 'symbols', keywords: ['percent', 'percentage', 'symbol'], label: 'Percent' },
  { name: 'anchor', icon: Anchor, category: 'symbols', keywords: ['anchor', 'ship', 'symbol'], label: 'Anchor' },
  
  // Shapes 카테고리
  { name: 'circle', icon: Circle, category: 'shapes', keywords: ['circle', 'round', 'shape'], label: 'Circle' },
  { name: 'square', icon: Square, category: 'shapes', keywords: ['square', 'box', 'shape'], label: 'Square' },
  { name: 'triangle', icon: Triangle, category: 'shapes', keywords: ['triangle', 'shape', 'geometry'], label: 'Triangle' },
  { name: 'hexagon', icon: Hexagon, category: 'shapes', keywords: ['hexagon', 'shape', 'geometry'], label: 'Hexagon' },
  { name: 'diamond', icon: Diamond, category: 'shapes', keywords: ['diamond', 'shape', 'gem'], label: 'Diamond' },
  { name: 'sparkles-shapes', icon: Sparkles, category: 'shapes', keywords: ['sparkles', 'magic', 'shine'], label: 'Sparkles' },
];

// 카테고리별 아이콘 필터링
export const getIconsByCategory = (category: IconCategory): IconInfo[] => {
  return iconData.filter(icon => icon.category === category);
};

// 키워드로 아이콘 검색
export const searchIcons = (query: string): IconInfo[] => {
  const lowerQuery = query.toLowerCase();
  return iconData.filter(icon => 
    icon.name.toLowerCase().includes(lowerQuery) ||
    icon.keywords.some(keyword => keyword.toLowerCase().includes(lowerQuery)) ||
    icon.label.toLowerCase().includes(lowerQuery)
  );
};

// 기본 아이콘 정보 (fallback으로 사용)
export const defaultIconInfo: IconInfo = {
  name: 'folder',
  icon: Folder,
  category: 'default',
  keywords: ['folder', 'directory', 'file'],
  label: 'Folder'
};

// 아이콘 이름으로 아이콘 정보 가져오기
export const getIconByName = (name: string): IconInfo | undefined => {
  return iconData.find(icon => icon.name === name);
};

// 안전한 아이콘 가져오기 (없으면 기본 아이콘 반환)
export const getSafeIconByName = (name: string): IconInfo => {
  const icon = getIconByName(name);
  if (!icon) {
    console.warn(`아이콘 '${name}'을 찾을 수 없습니다. 기본 아이콘을 사용합니다.`);
    return defaultIconInfo;
  }
  return icon;
};

// 모든 카테고리 목록 가져오기
export const getAllCategories = (): { key: IconCategory; label: string }[] => {
  return Object.entries(iconCategories).map(([key, label]) => ({
    key: key as IconCategory,
    label
  }));
};

// 기본 색상 팔레트
export const defaultColors = [
  '#3B82F6', // blue-500
  '#EF4444', // red-500
  '#10B981', // emerald-500
  '#F59E0B', // amber-500
  '#8B5CF6', // violet-500
  '#EC4899', // pink-500
  '#06B6D4', // cyan-500
  '#84CC16', // lime-500
  '#F97316', // orange-500
  '#6366F1', // indigo-500
  '#14B8A6', // teal-500
  '#A855F7', // purple-500
  '#EAB308', // yellow-500
  '#22C55E', // green-500
  '#F43F5E', // rose-500
  '#0EA5E9', // sky-500
  '#6B7280', // gray-500
  '#374151', // gray-700
  '#1F2937', // gray-800
  '#111827', // gray-900
]; 