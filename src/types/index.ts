export type FoodType = 'veg' | 'non_veg';

export interface SiteSettings {
  id: string;
  restaurantName: string;
  tagline: string;
  description: string;
  logoUrl?: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  mapsUrl: string;
  mapsEmbedUrl: string;
  latitude: number;
  longitude: number;
  orderUrl: string;
  orderingPlatformName: string;
  instagramUrl: string;
  facebookUrl: string;
  youtubeUrl: string;
  heroHeading: string;
  heroSubheading: string;
  heroImageUrl: string;
  heroCtaText: string;
  aboutHeading: string;
  aboutDescription: string;
  aboutImageUrl: string;
  aboutEstablishedYear?: string;
  aboutHighlights: string[];
  whyChooseUs: {
    id: string;
    title: string;
    description: string;
    icon: string;
  }[];
  sectionsEnabled: {
    hero: boolean;
    quickActions: boolean;
    popularItems: boolean;
    menu: boolean;
    about: boolean;
    whyChooseUs: boolean;
    offers: boolean;
    gallery: boolean;
    reviews: boolean;
    hours: boolean;
    location: boolean;
    contact: boolean;
  };
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  displayOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MenuVariant {
  id: string;
  name: string; // e.g. "Small (S)", "Large (L)", "Single", "Double", "2 pcs - Fried Chicken", etc.
  price: number | 'MRP';
  available?: boolean;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  price: number | 'MRP';
  discountPrice?: number | null;
  imageUrl: string;
  foodType: FoodType;
  popular: boolean;
  available: boolean;
  variants?: MenuVariant[];
  ingredients?: string;
  servingInfo?: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartItemAddon {
  id: string;
  name: string;
  price: number;
}

export interface CartItem {
  id: string; // unique key in cart
  menuItemId: string;
  name: string;
  categoryName?: string;
  foodType: FoodType;
  variant?: MenuVariant;
  unitPrice: number;
  quantity: number;
  addons?: CartItemAddon[];
  imageUrl?: string;
}

export interface CustomerOrder {
  id: string;
  customerName: string;
  customerPhone: string;
  orderType: 'takeaway' | 'delivery' | 'dine_in';
  deliveryAddress?: string;
  tableNumber?: string;
  notes?: string;
  items: CartItem[];
  subtotal: number;
  addonsTotal: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface GalleryItem {
  id: string;
  imageUrl: string;
  category: 'Food' | 'Interior' | 'Exterior' | 'Ambience' | 'Other';
  caption: string;
  displayOrder: number;
  featured: boolean;
  createdAt: string;
}

export interface ReviewItem {
  id: string;
  customerName: string;
  rating: number; // 1 to 5
  reviewText: string;
  reviewDate: string;
  featured: boolean;
  source?: string;
  createdAt: string;
}

export interface OfferItem {
  id: string;
  title: string;
  description: string;
  discount: string;
  imageUrl?: string;
  code?: string;
  startDate?: string;
  endDate?: string;
  active: boolean;
  createdAt: string;
}

export interface BusinessDayHours {
  id: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  openTime: string; // e.g. "11:00"
  closeTime: string; // e.g. "22:00"
  closed: boolean;
}

export interface DatabaseSchema {
  settings: SiteSettings;
  categories: Category[];
  menuItems: MenuItem[];
  gallery: GalleryItem[];
  reviews: ReviewItem[];
  offers: OfferItem[];
  businessHours: BusinessDayHours[];
  orders?: CustomerOrder[];
  adminSessionToken?: string;
}
