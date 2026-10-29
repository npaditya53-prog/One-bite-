import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { db, sanitizeOrderForFirestore } from './firebase.ts';
import { initialData } from '../data/initialData.ts';
import { Category, MenuItem, OfferItem, SiteSettings, Coupon } from '../types/index.ts';

const INIT_DOC_PATH = doc(db, 'system', 'catalog_initialized');

/**
 * Check and seed initial catalog data into Firestore ONLY ONCE.
 * Once system/catalog_initialized is set, Firestore is the sole authoritative
 * source of truth and deleted documents will NEVER be re-seeded or recreated.
 */
export async function ensureFirestoreCatalogInitialized(): Promise<void> {
  try {
    const initSnap = await getDoc(INIT_DOC_PATH);
    if (initSnap.exists()) {
      return; // Already initialized once. Respect permanent deletions!
    }

    console.log('[Firestore Catalog] Initializing Firestore collections with initial One Bite catalog...');
    const batch = writeBatch(db);

    // 1. Settings
    const settingsRef = doc(db, 'settings', 'default_settings');
    batch.set(settingsRef, sanitizeOrderForFirestore(initialData.settings));

    // 2. Categories
    for (const cat of initialData.categories) {
      const ref = doc(db, 'categories', cat.id);
      batch.set(ref, sanitizeOrderForFirestore(cat));
    }

    // 3. Menu Items
    for (const item of initialData.menuItems) {
      const ref = doc(db, 'menuItems', item.id);
      batch.set(ref, sanitizeOrderForFirestore(item));
    }

    // 4. Offers
    for (const offer of initialData.offers) {
      const ref = doc(db, 'offers', offer.id);
      batch.set(ref, sanitizeOrderForFirestore(offer));
    }

    // 5. System Marker
    batch.set(INIT_DOC_PATH, {
      initialized: true,
      initializedAt: new Date().toISOString(),
      restaurantName: 'One Bite Motihari',
    });

    await batch.commit();
    console.log('[Firestore Catalog] Successfully seeded initial catalog data to Firestore.');
  } catch (err) {
    console.warn('[Firestore Catalog Initialization Notice]:', err);
  }
}

/**
 * Subscribe to real-time Menu Items updates from Firestore
 */
export function subscribeToMenuItems(
  onUpdate: (items: MenuItem[]) => void,
  onError?: (err: Error) => void
): () => void {
  const colRef = collection(db, 'menuItems');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: MenuItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as MenuItem;
        items.push({ ...data, id: docSnap.id });
      });
      items.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
      onUpdate(items);
    },
    (error) => {
      console.warn('Firestore menuItems onSnapshot notice:', error?.message);
      if (onError) onError(error);
    }
  );
}

/**
 * Subscribe to real-time Offers updates from Firestore
 */
export function subscribeToOffers(
  onUpdate: (offers: OfferItem[]) => void,
  onError?: (err: Error) => void
): () => void {
  const colRef = collection(db, 'offers');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const offersList: OfferItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as OfferItem;
        offersList.push({ ...data, id: docSnap.id });
      });
      onUpdate(offersList);
    },
    (error) => {
      console.warn('Firestore offers onSnapshot notice:', error?.message);
      if (onError) onError(error);
    }
  );
}

/**
 * Subscribe to real-time Categories updates from Firestore
 */
export function subscribeToCategories(
  onUpdate: (cats: Category[]) => void,
  onError?: (err: Error) => void
): () => void {
  const colRef = collection(db, 'categories');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const catList: Category[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Category;
        catList.push({ ...data, id: docSnap.id });
      });
      catList.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
      onUpdate(catList);
    },
    (error) => {
      console.warn('Firestore categories onSnapshot notice:', error?.message);
      if (onError) onError(error);
    }
  );
}

/**
 * Subscribe to real-time Site Settings updates from Firestore
 */
export function subscribeToSettings(
  onUpdate: (settings: SiteSettings) => void,
  onError?: (err: Error) => void
): () => void {
  const settingsDocRef = doc(db, 'settings', 'default_settings');
  return onSnapshot(
    settingsDocRef,
    (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data() as SiteSettings);
      }
    },
    (error) => {
      console.warn('Firestore settings onSnapshot notice:', error?.message);
      if (onError) onError(error);
    }
  );
}

/**
 * Save a menu item to Firestore with clean payload
 */
export async function saveMenuItemToFirestore(item: Partial<MenuItem>): Promise<MenuItem> {
  const id = item.id || `item_${Date.now()}`;
  const now = new Date().toISOString();
  const cleanItem: MenuItem = {
    id,
    categoryId: item.categoryId || '',
    name: item.name || 'New Item',
    slug: item.slug || (item.name ? item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'new-item'),
    description: item.description || '',
    price: item.price === 'MRP' ? 'MRP' : (item.price !== undefined ? Number(item.price) : 0),
    discountPrice: item.discountPrice ? Number(item.discountPrice) : null,
    imageUrl: item.imageUrl || 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80',
    foodType: (item.foodType === 'non_veg' ? 'non_veg' : 'veg') as any,
    popular: Boolean(item.popular),
    available: item.available !== undefined ? Boolean(item.available) : true,
    variants: Array.isArray(item.variants) ? item.variants : undefined,
    ingredients: item.ingredients || '',
    servingInfo: item.servingInfo || '',
    displayOrder: typeof item.displayOrder === 'number' ? item.displayOrder : 1,
    createdAt: item.createdAt || now,
    updatedAt: now,
  };

  const cleanPayload = sanitizeOrderForFirestore(cleanItem) as MenuItem;
  const docRef = doc(db, 'menuItems', id);
  try {
    await setDoc(docRef, cleanPayload);
  } catch (err: any) {
    if (err?.code === 'permission-denied' || err?.message?.includes('PERMISSION_DENIED')) {
      console.warn('[Firestore] Unauthenticated SDK write blocked by security rules for menuItem:', id);
    } else {
      throw err;
    }
  }
  return cleanItem;
}

/**
 * Permanently delete a menu item from Firestore
 */
export async function deleteMenuItemFromFirestore(id: string): Promise<void> {
  if (!id) throw new Error('Menu item ID is required for deletion');
  const docRef = doc(db, 'menuItems', id);
  try {
    await deleteDoc(docRef);
  } catch (err: any) {
    if (err?.code === 'permission-denied' || err?.message?.includes('PERMISSION_DENIED')) {
      console.warn('[Firestore] Unauthenticated SDK delete blocked by security rules for menuItem:', id);
    } else {
      throw err;
    }
  }
}

/**
 * Save an offer to Firestore with clean payload
 */
export async function saveOfferToFirestore(offer: Partial<OfferItem>): Promise<OfferItem> {
  const id = offer.id || `off_${Date.now()}`;
  const now = new Date().toISOString();
  const cleanOffer: OfferItem = {
    id,
    title: offer.title || 'New Offer',
    description: offer.description || '',
    offerType: offer.offerType || 'percentage',
    discountValue: offer.discountValue !== undefined ? Number(offer.discountValue) : undefined,
    discount: offer.discount || 'Special Offer',
    targetType: offer.targetType || 'all',
    targetCategoryIds: offer.targetCategoryIds || [],
    targetItemIds: offer.targetItemIds || [],
    startDate: offer.startDate || now,
    endDate: offer.endDate || now,
    imageUrl: offer.imageUrl || '',
    code: offer.code ? offer.code.trim().toUpperCase() : '',
    terms: offer.terms || '',
    isPublic: offer.isPublic !== undefined ? Boolean(offer.isPublic) : true,
    status: (offer.status as any) || 'active',
    active: offer.active !== undefined ? Boolean(offer.active) : true,
    minOrderValue: offer.minOrderValue ? Number(offer.minOrderValue) : undefined,
    createdAt: offer.createdAt || now,
    updatedAt: now,
  };

  const cleanPayload = sanitizeOrderForFirestore(cleanOffer) as OfferItem;
  const docRef = doc(db, 'offers', id);
  try {
    await setDoc(docRef, cleanPayload);
  } catch (err: any) {
    if (err?.code === 'permission-denied' || err?.message?.includes('PERMISSION_DENIED')) {
      console.warn('[Firestore] Unauthenticated SDK write blocked by security rules for offer:', id);
    } else {
      throw err;
    }
  }
  return cleanOffer;
}

/**
 * Permanently delete an offer from Firestore
 */
export async function deleteOfferFromFirestore(id: string): Promise<void> {
  if (!id) throw new Error('Offer ID is required for deletion');
  const docRef = doc(db, 'offers', id);
  try {
    await deleteDoc(docRef);
  } catch (err: any) {
    if (err?.code === 'permission-denied' || err?.message?.includes('PERMISSION_DENIED')) {
      console.warn('[Firestore] Unauthenticated SDK delete blocked by security rules for offer:', id);
    } else {
      throw err;
    }
  }
}

/**
 * Save a category to Firestore
 */
export async function saveCategoryToFirestore(category: Partial<Category>): Promise<Category> {
  const id = category.id || `cat_${Date.now()}`;
  const now = new Date().toISOString();
  const cleanCat: Category = {
    id,
    name: category.name || 'New Category',
    slug: category.slug || (category.name ? category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'new-category'),
    description: category.description || '',
    displayOrder: typeof category.displayOrder === 'number' ? category.displayOrder : 1,
    active: category.active !== undefined ? Boolean(category.active) : true,
    createdAt: category.createdAt || now,
    updatedAt: now,
  };

  const cleanPayload = sanitizeOrderForFirestore(cleanCat) as Category;
  const docRef = doc(db, 'categories', id);
  try {
    await setDoc(docRef, cleanPayload);
  } catch (err: any) {
    if (err?.code === 'permission-denied' || err?.message?.includes('PERMISSION_DENIED')) {
      console.warn('[Firestore] Unauthenticated SDK write blocked by security rules for category:', id);
    } else {
      throw err;
    }
  }
  return cleanCat;
}

/**
 * Delete a category from Firestore
 */
export async function deleteCategoryFromFirestore(id: string): Promise<void> {
  if (!id) throw new Error('Category ID is required for deletion');
  const docRef = doc(db, 'categories', id);
  try {
    await deleteDoc(docRef);
  } catch (err: any) {
    if (err?.code === 'permission-denied' || err?.message?.includes('PERMISSION_DENIED')) {
      console.warn('[Firestore] Unauthenticated SDK delete blocked by security rules for category:', id);
    } else {
      throw err;
    }
  }
}

/**
 * Save settings to Firestore
 */
export async function saveSettingsToFirestore(settings: Partial<SiteSettings>): Promise<void> {
  const docRef = doc(db, 'settings', 'default_settings');
  const cleanPayload = sanitizeOrderForFirestore(settings);
  try {
    await setDoc(docRef, cleanPayload, { merge: true });
  } catch (err: any) {
    if (err?.code === 'permission-denied' || err?.message?.includes('PERMISSION_DENIED')) {
      console.warn('[Firestore] Unauthenticated SDK write blocked by security rules for settings');
    } else {
      throw err;
    }
  }
}

/**
 * Subscribe to real-time Coupons updates from Firestore
 */
export function subscribeToCoupons(
  onUpdate: (coupons: Coupon[]) => void,
  onError?: (err: Error) => void
): () => void {
  const colRef = collection(db, 'coupons');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const couponsList: Coupon[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Coupon;
        couponsList.push({ ...data, id: docSnap.id });
      });
      couponsList.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      onUpdate(couponsList);
    },
    (error) => {
      console.warn('Firestore coupons onSnapshot notice:', error?.message);
      if (onError) onError(error);
    }
  );
}

/**
 * Save a coupon to Firestore with clean payload
 */
export async function saveCouponToFirestore(coupon: Partial<Coupon>): Promise<Coupon> {
  const id = coupon.id || `coup_${Date.now()}`;
  const now = new Date().toISOString();
  const cleanCoupon: Coupon = {
    id,
    code: (coupon.code || 'COUPON').trim().toUpperCase(),
    description: coupon.description || '',
    discountType: coupon.discountType === 'percentage' ? 'percentage' : 'fixed',
    discountValue: Math.max(0, Number(coupon.discountValue) || 0),
    minOrderAmount: Math.max(0, Number(coupon.minOrderAmount) || 0),
    maxDiscount: coupon.maxDiscount ? Math.max(0, Number(coupon.maxDiscount)) : null,
    expiryDate: coupon.expiryDate || null,
    usageLimit: coupon.usageLimit ? Math.max(0, Number(coupon.usageLimit)) : null,
    perCustomerLimit: coupon.perCustomerLimit ? Math.max(1, Number(coupon.perCustomerLimit)) : 1,
    usedCount: typeof coupon.usedCount === 'number' ? coupon.usedCount : 0,
    applicabilityType: coupon.applicabilityType || 'all',
    applicableCategoryIds: Array.isArray(coupon.applicableCategoryIds) ? coupon.applicableCategoryIds : [],
    applicableItemIds: Array.isArray(coupon.applicableItemIds) ? coupon.applicableItemIds : [],
    isActive: coupon.isActive !== undefined ? Boolean(coupon.isActive) : true,
    createdAt: coupon.createdAt || now,
    updatedAt: now,
  };

  const cleanPayload = sanitizeOrderForFirestore(cleanCoupon) as Coupon;
  const docRef = doc(db, 'coupons', id);
  try {
    await setDoc(docRef, cleanPayload);
  } catch (err: any) {
    if (err?.code === 'permission-denied' || err?.message?.includes('PERMISSION_DENIED')) {
      console.warn('[Firestore] Unauthenticated SDK write blocked by security rules for coupon:', id);
    } else {
      throw err;
    }
  }
  return cleanCoupon;
}

/**
 * Permanently delete a coupon from Firestore
 */
export async function deleteCouponFromFirestore(id: string): Promise<void> {
  if (!id) throw new Error('Coupon ID is required for deletion');
  const docRef = doc(db, 'coupons', id);
  try {
    await deleteDoc(docRef);
  } catch (err: any) {
    if (err?.code === 'permission-denied' || err?.message?.includes('PERMISSION_DENIED')) {
      console.warn('[Firestore] Unauthenticated SDK delete blocked by security rules for coupon:', id);
    } else {
      throw err;
    }
  }
}

