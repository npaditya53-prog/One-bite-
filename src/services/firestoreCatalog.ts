import {
  doc,
  getDoc,
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

// Client-side write functions (saveMenuItemToFirestore, deleteMenuItemFromFirestore, etc.) 
// have been removed to enforce server-side authoritative mutations.


