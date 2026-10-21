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
  deliveryCharge?: number;
  freeDeliveryThreshold?: number;
  estimatedDeliveryTime?: string;
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
  houseFlat?: string;
  streetArea?: string;
  landmark?: string;
  city?: string;
  pincode?: string;
  deliveryInstructions?: string;
  deliveryAddress?: string;
  tableNumber?: string;
  notes?: string;
  items: CartItem[];
  subtotal: number;
  addonsTotal: number;
  discountAmount?: number;
  appliedOfferTitle?: string;
  deliveryCharge?: number;
  totalAmount: number;
  paymentMethod?: 'pay_on_delivery';
  paymentStatus?: 'unpaid' | 'paid';
  customerUid?: string;
  customerEmail?: string;
  status: OrderStatus;
  statusHistory?: StatusHistoryItem[];
  deliveryStatus?: 'Delivered' | 'Pending' | 'Out for Delivery' | 'Assigned' | 'Packed' | string;
  assignedToDeliveryBoy?: boolean;
  assignedAt?: string;
  assignedBy?: string;
  placedAt?: string;
  packedAt?: string;
  outForDeliveryAt?: string;
  startedDeliveryAt?: string;
  deliveredAt?: string;
  deliveredBy?: string;
  updatedAt?: string;
  createdAt: string;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'packed'
  | 'out_for_delivery'
  | 'delivered'
  | 'completed'
  | 'cancelled';

export interface StatusHistoryItem {
  status: OrderStatus;
  statusName?: string;
  timestamp: string;
  updatedBy?: string;
  updaterId?: string;
  note?: string;
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

export type OfferType = 'percentage' | 'flat_amount' | 'fixed_price' | 'bogo' | 'custom';
export type OfferTarget = 'all' | 'veg_only' | 'non_veg_only' | 'categories' | 'items';
export type OfferStatus = 'active' | 'scheduled' | 'expired' | 'paused' | 'draft';

export interface OfferItem {
  id: string;
  title: string;
  description: string;
  offerType?: OfferType;
  discountValue?: number; // e.g. 10 for 10%, 50 for ₹50
  discount: string; // display badge, e.g. "10% OFF", "FLAT ₹50 OFF"
  targetType?: OfferTarget;
  targetCategoryIds?: string[]; // category IDs if targetType === 'categories'
  targetItemIds?: string[]; // item IDs if targetType === 'items'
  imageUrl?: string;
  code?: string;
  startDate?: string; // YYYY-MM-DD or YYYY-MM-DDTHH:mm
  endDate?: string; // YYYY-MM-DD or YYYY-MM-DDTHH:mm
  terms?: string;
  isPublic?: boolean;
  status?: OfferStatus;
  minOrderValue?: number;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
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
