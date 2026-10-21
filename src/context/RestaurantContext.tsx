import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  DatabaseSchema,
  SiteSettings,
  Category,
  MenuItem,
  MenuVariant,
  CartItem,
  CartItemAddon,
  CustomerOrder,
  GalleryItem,
  ReviewItem,
  OfferItem,
  BusinessDayHours,
} from '../types/index.ts';
import { initialData } from '../data/initialData.ts';
import { api, authStorage } from '../services/api.ts';
import {
  db,
  auth,
  onAuthStateChanged,
  signInWithGoogle,
  signInWithEmail,
  signOutUser,
  handleFirestoreError,
  OperationType,
  User,
  saveOrderToFirestore,
  assignOrderInFirestore,
  unassignOrderInFirestore,
  fetchCustomerOrdersFromFirestore,
  updateOrderStatusInFirestore,
} from '../services/firebase.ts';
import { doc, setDoc, deleteDoc, collection, onSnapshot } from 'firebase/firestore';
import {
  isOfferPubliclyActive,
  calculateCartDiscount,
  CartDiscountResult,
} from '../utils/offerUtils.ts';
import {
  isRestaurantOpen,
  getLiveOperatingStatus,
  RESTAURANT_CLOSED_MESSAGE,
} from '../utils/operatingHours.ts';
import { getStatusDisplayName } from '../utils/orderTimeline.ts';

export interface OpenStatus {
  isOpen: boolean;
  statusText: string;
  shortBadgeText: string;
  todayScheduleText: string;
  currentIstTime?: string;
  reopenMessage?: string;
}

interface RestaurantContextType {
  settings: SiteSettings;
  categories: Category[];
  menuItems: MenuItem[];
  gallery: GalleryItem[];
  reviews: ReviewItem[];
  offers: OfferItem[];
  businessHours: BusinessDayHours[];
  orders: CustomerOrder[];
  isLoading: boolean;
  error: string | null;
  isAdmin: boolean;
  adminUser: { email?: string; phone?: string; identifier?: string; role: string } | null;
  openStatus: OpenStatus;
  isClosedModalOpen: boolean;
  setIsClosedModalOpen: (open: boolean) => void;

  // Computed collections
  popularItems: MenuItem[];
  activeOffers: OfferItem[];

  // Cart State & Actions
  cart: CartItem[];
  cartCount: number;
  cartTotal: number;
  appliedOffer: OfferItem | null;
  applyOffer: (offerOrCode: OfferItem | string) => { success: boolean; message: string };
  removeOffer: () => void;
  cartDiscount: CartDiscountResult;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  selectedVariantItem: MenuItem | null;
  setSelectedVariantItem: (item: MenuItem | null) => void;
  addToCart: (item: MenuItem, variant?: MenuVariant, addons?: CartItemAddon[], quantity?: number) => void;
  updateCartQuantity: (cartItemId: string, delta: number) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  placeOrder: (customer: {
    customerName: string;
    customerPhone: string;
    orderType?: 'takeaway' | 'delivery' | 'dine_in';
    houseFlat?: string;
    streetArea?: string;
    landmark?: string;
    city?: string;
    pincode?: string;
    deliveryInstructions?: string;
    deliveryAddress?: string;
    tableNumber?: string;
    notes?: string;
  }) => Promise<{ success: boolean; whatsappUrl: string; order: CustomerOrder }>;

  // Customer Orders & Account
  customerOrders: CustomerOrder[];
  customerOrdersLoading: boolean;
  loadCustomerOrders: () => Promise<CustomerOrder[]>;
  authInitialized: boolean;

  // Admin Actions
  refreshData: () => Promise<void>;
  setIsAdmin: (isAdmin: boolean) => void;
  setAdminUser: (user: any) => void;
  loginWithMagicToken: (token: string) => Promise<void>;
  login: (email: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<{ user: User; isAdmin: boolean }>;
  loginWithMobile: (phone: string, otp: string) => Promise<void>;
  loginWithFirebasePhone: (phone: string, firebaseUser: User) => Promise<void>;
  checkAdminPhone: (phone: string) => Promise<{ authorized: boolean; phone?: string }>;
  sendOtp: (phone: string) => Promise<{ success: boolean; message: string; expiresInSeconds?: number }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  firebaseUser: User | null;
  updateSettings: (data: Partial<SiteSettings>) => Promise<void>;
  saveCategory: (category: Partial<Category>) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;
  saveMenuItem: (item: Partial<MenuItem>) => Promise<MenuItem>;
  deleteMenuItem: (id: string) => Promise<void>;
  duplicateMenuItem: (id: string) => Promise<MenuItem>;
  saveGalleryItem: (photo: Partial<GalleryItem>) => Promise<GalleryItem>;
  deleteGalleryItem: (id: string) => Promise<void>;
  saveReview: (review: Partial<ReviewItem>) => Promise<ReviewItem>;
  deleteReview: (id: string) => Promise<void>;
  saveOffer: (offer: Partial<OfferItem>) => Promise<OfferItem>;
  deleteOffer: (id: string) => Promise<void>;
  saveBusinessHours: (hours: BusinessDayHours[]) => Promise<void>;
  uploadImage: (data: string, filename?: string) => Promise<string>;
  resetToDefaults: () => Promise<void>;
  updateOrderStatus: (id: string, status: CustomerOrder['status'], paymentStatus?: 'unpaid' | 'paid', note?: string) => Promise<void>;
  updateOrderPaymentStatus: (id: string, paymentStatus: 'unpaid' | 'paid') => Promise<void>;
  assignOrderToDeliveryBoy: (orderId: string) => Promise<void>;
  unassignOrderFromDeliveryBoy: (orderId: string) => Promise<void>;
  createManualOrder: (orderData: Partial<CustomerOrder>, assignImmediately?: boolean) => Promise<CustomerOrder>;

  // Order Success Celebration Modal
  celebrationOrder: CustomerOrder | null;
  celebrationWhatsappUrl: string;
  triggerOrderCelebration: (order: CustomerOrder, whatsappUrl?: string) => void;
  dismissOrderCelebration: () => void;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

function format12Hour(time24: string): string {
  if (!time24) return '';
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12;
  return `${h}:${m} ${ampm}`;
}

const CART_STORAGE_KEY = 'onebite_cart_items';

export function RestaurantProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<DatabaseSchema>(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUser, setAdminUser] = useState<{ email?: string; phone?: string; identifier?: string; role: string } | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);

  // Order Celebration State
  const [celebrationOrder, setCelebrationOrder] = useState<CustomerOrder | null>(null);
  const [celebrationWhatsappUrl, setCelebrationWhatsappUrl] = useState<string>('');
  const celebratedOrderIdsRef = useRef<Set<string>>(new Set());

  const triggerOrderCelebration = useCallback((order: CustomerOrder, whatsappUrl?: string) => {
    if (!order || !order.id) return;
    if (celebratedOrderIdsRef.current.has(order.id)) {
      // Prevent duplicate success popups for the same order
      return;
    }
    celebratedOrderIdsRef.current.add(order.id);
    setCelebrationOrder(order);
    if (whatsappUrl) {
      setCelebrationWhatsappUrl(whatsappUrl);
    }
  }, []);

  const dismissOrderCelebration = useCallback(() => {
    setCelebrationOrder(null);
  }, []);

  const [authInitialized, setAuthInitialized] = useState(false);
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([]);
  const [customerOrdersLoading, setCustomerOrdersLoading] = useState(false);

  const getLocalOrderIds = useCallback((): string[] => {
    try {
      const raw = localStorage.getItem('onebite_customer_order_ids');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }, []);

  const addLocalOrderId = useCallback((orderId: string) => {
    try {
      const existing = getLocalOrderIds();
      const updated = Array.from(new Set([orderId, ...existing])).slice(0, 50);
      localStorage.setItem('onebite_customer_order_ids', JSON.stringify(updated));
    } catch {}
  }, [getLocalOrderIds]);

  const loadCustomerOrders = useCallback(async (): Promise<CustomerOrder[]> => {
    setCustomerOrdersLoading(true);
    try {
      const localIds = getLocalOrderIds();
      const uid = firebaseUser?.uid;

      let apiOrders: CustomerOrder[] = [];
      try {
        apiOrders = await api.getMyOrders(uid, localIds);
      } catch (e) {
        console.warn('API getMyOrders error:', e);
      }

      let firestoreOrders: CustomerOrder[] = [];
      if (uid) {
        try {
          firestoreOrders = await fetchCustomerOrdersFromFirestore(uid);
        } catch (e) {
          console.warn('Firestore fetchCustomerOrders error:', e);
        }
      }

      const orderMap = new Map<string, CustomerOrder>();
      firestoreOrders.forEach(o => orderMap.set(o.id, o));
      apiOrders.forEach(o => orderMap.set(o.id, o));

      const merged = Array.from(orderMap.values());
      merged.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      setCustomerOrders(merged);
      return merged;
    } finally {
      setCustomerOrdersLoading(false);
    }
  }, [firebaseUser, getLocalOrderIds]);

  // Listen to Firebase Auth state with secure server-side admin authorization check
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          const authRes = await api.loginFirebaseUser(user.email || undefined, user.phoneNumber || undefined);
          setIsAdmin(true);
          setAdminUser(authRes.user);
          try {
            const ords = await api.getOrders();
            setOrders(ords);
          } catch (e) {
            console.warn('Orders fetch on auth sync:', e);
          }
        } catch {
          // Normal customer
          setIsAdmin(false);
          setAdminUser(null);
        }
      } else {
        setIsAdmin(false);
        setAdminUser(null);
      }
      setAuthInitialized(true);
    });
    return () => unsub();
  }, []);

  // Sync customer orders when user or auth changes
  useEffect(() => {
    loadCustomerOrders();
  }, [firebaseUser, loadCustomerOrders]);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isClosedModalOpen, setIsClosedModalOpen] = useState(false);
  const [selectedVariantItem, setSelectedVariantItem] = useState<MenuItem | null>(null);
  const [appliedOffer, setAppliedOffer] = useState<OfferItem | null>(null);
  const isPlacingOrderRef = useRef(false);

  // Auto-updating IST clock ticker (every 5 seconds) to ensure status changes without page refresh
  const [currentIstTick, setCurrentIstTick] = useState<Date>(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIstTick(new Date());
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Sync cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (err) {
      console.warn('Could not save cart to localStorage', err);
    }
  }, [cart]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.getData();
      setData(res);
      if (res.orders) {
        setOrders(res.orders);
      }
    } catch (err: any) {
      console.error('Failed to load restaurant data:', err);
      setError(err?.message || 'Failed to load restaurant data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkAdminAuth = useCallback(async () => {
    const authed = await api.checkAuth();
    setIsAdmin(authed);
    if (authed) {
      setAdminUser({ email: 'admin@onebitemotihari.in', role: 'admin' });
      try {
        const ords = await api.getOrders();
        setOrders(ords);
      } catch (err) {
        console.warn('Failed to load orders for admin', err);
      }
    } else {
      setAdminUser(null);
    }
  }, []);

  useEffect(() => {
    loadData();
    checkAdminAuth();
  }, [loadData, checkAdminAuth]);

  // Real-Time Orders Synchronization (Firebase Firestore onSnapshot + Continuous Sync Polling)
  useEffect(() => {
    if (!isAdmin) return;

    let isSubscribed = true;
    let unsubFirestore: (() => void) | null = null;

    // Helper to merge and sort orders (latest orders first)
    const mergeOrders = (newOrders: CustomerOrder[]) => {
      setOrders(prev => {
        const orderMap = new Map<string, CustomerOrder>();
        prev.forEach(o => orderMap.set(o.id, o));
        newOrders.forEach(o => orderMap.set(o.id, o));

        const merged = Array.from(orderMap.values());
        merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return merged;
      });
    };

    // 1. Firebase Firestore onSnapshot real-time listener
    try {
      const ordersCol = collection(db, 'orders');
      unsubFirestore = onSnapshot(
        ordersCol,
        (snapshot) => {
          if (!isSubscribed) return;
          const fbOrders: CustomerOrder[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as CustomerOrder;
            fbOrders.push({ ...data, id: docSnap.id });
          });
          if (fbOrders.length > 0) {
            mergeOrders(fbOrders);
          }
        },
        (error) => {
          console.warn('Firestore orders onSnapshot notice:', error?.message);
        }
      );
    } catch (e) {
      console.warn('Failed to attach Firestore orders listener:', e);
    }

    // 2. Continuous reliable synchronization polling from protected server API every 3.5 seconds
    const syncFromServer = async () => {
      try {
        const serverOrders = await api.getOrders();
        if (isSubscribed && Array.isArray(serverOrders) && serverOrders.length > 0) {
          mergeOrders(serverOrders);
        }
      } catch {
        // Handled silently
      }
    };

    syncFromServer();
    const intervalId = setInterval(syncFromServer, 3500);

    return () => {
      isSubscribed = false;
      if (unsubFirestore) unsubFirestore();
      clearInterval(intervalId);
    };
  }, [isAdmin]);

  // Compute live open status for Indian Standard Time (11:00 AM to 8:45 PM IST)
  // Automatically synchronized with real-time clock ticker
  const openStatus = useMemo((): OpenStatus => {
    const live = getLiveOperatingStatus(currentIstTick);
    return {
      isOpen: live.isOpen,
      statusText: live.statusText,
      shortBadgeText: live.shortBadgeText,
      todayScheduleText: live.todayScheduleText,
      currentIstTime: live.currentIstTime,
      reopenMessage: live.reopenMessage,
    };
  }, [currentIstTick]);

  const popularItems = useMemo(() => {
    return data.menuItems.filter(item => item.popular && item.available);
  }, [data.menuItems]);

  const activeOffers = useMemo(() => {
    return data.offers.filter(offer => isOfferPubliclyActive(offer));
  }, [data.offers]);

  // Cart Calculations
  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const addonsPrice = (item.addons || []).reduce((aSum, a) => aSum + a.price, 0);
      return sum + (item.unitPrice + addonsPrice) * item.quantity;
    }, 0);
  }, [cart]);

  const cartDiscount = useMemo(() => {
    return calculateCartDiscount(cart, appliedOffer, data.menuItems);
  }, [cart, appliedOffer, data.menuItems]);

  const applyOffer = useCallback(
    (offerOrCode: OfferItem | string) => {
      let targetOffer: OfferItem | undefined;
      if (typeof offerOrCode === 'string') {
        const query = offerOrCode.trim().toUpperCase();
        targetOffer = data.offers.find(
          o => isOfferPubliclyActive(o) && o.code && o.code.toUpperCase() === query
        );
        if (!targetOffer) {
          return { success: false, message: `Invalid or expired coupon code "${offerOrCode}".` };
        }
      } else {
        targetOffer = offerOrCode;
      }

      if (!isOfferPubliclyActive(targetOffer)) {
        return { success: false, message: `Offer "${targetOffer.title}" is currently not active.` };
      }

      const check = calculateCartDiscount(cart, targetOffer, data.menuItems);
      if (!check.isEligible) {
        return { success: false, message: check.message || 'No items in your cart qualify for this offer.' };
      }

      setAppliedOffer(targetOffer);
      return { success: true, message: `Offer "${targetOffer.title}" applied successfully!` };
    },
    [cart, data.offers, data.menuItems]
  );

  const removeOffer = useCallback(() => {
    setAppliedOffer(null);
  }, []);

  // Cart Actions
  const addToCart = useCallback(
    (item: MenuItem, variant?: MenuVariant, addons: CartItemAddon[] = [], quantity: number = 1) => {
      // Determine unit price
      let unitPrice = 0;
      if (variant) {
        unitPrice = variant.price === 'MRP' ? 20 : Number(variant.price);
      } else if (item.price === 'MRP') {
        unitPrice = 20;
      } else {
        unitPrice = item.discountPrice ?? Number(item.price);
      }

      // Unique cart key based on item id, variant id, and sorted addons ids
      const addonsKey = addons.map(a => a.id).sort().join('_');
      const cartKey = `${item.id}_${variant ? variant.id : 'base'}_${addonsKey}`;

      const categoryObj = data.categories.find(c => c.id === item.categoryId);

      setCart(prevCart => {
        const existingIdx = prevCart.findIndex(ci => ci.id === cartKey);
        if (existingIdx > -1) {
          const updated = [...prevCart];
          updated[existingIdx] = {
            ...updated[existingIdx],
            quantity: updated[existingIdx].quantity + quantity,
          };
          return updated;
        } else {
          return [
            ...prevCart,
            {
              id: cartKey,
              menuItemId: item.id,
              name: item.name,
              categoryName: categoryObj?.name,
              foodType: item.foodType,
              variant,
              unitPrice,
              quantity,
              addons,
              imageUrl: item.imageUrl,
            },
          ];
        }
      });
    },
    [data.categories]
  );

  const updateCartQuantity = useCallback((cartItemId: string, delta: number) => {
    setCart(prevCart => {
      return prevCart
        .map(ci => {
          if (ci.id === cartItemId) {
            const newQty = ci.quantity + delta;
            return newQty > 0 ? { ...ci, quantity: newQty } : null;
          }
          return ci;
        })
        .filter(Boolean) as CartItem[];
    });
  }, []);

  const removeFromCart = useCallback((cartItemId: string) => {
    setCart(prevCart => prevCart.filter(ci => ci.id !== cartItemId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch {}
  }, []);

  // Place Order & WhatsApp Generator
  const placeOrder = useCallback(
    async (customer: {
      customerName: string;
      customerPhone: string;
      orderType?: 'takeaway' | 'delivery' | 'dine_in';
      houseFlat?: string;
      streetArea?: string;
      landmark?: string;
      city?: string;
      pincode?: string;
      deliveryInstructions?: string;
      deliveryAddress?: string;
      tableNumber?: string;
      notes?: string;
    }) => {
      if (isPlacingOrderRef.current) {
        throw new Error('Your order is already being processed. Please wait a moment.');
      }
      isPlacingOrderRef.current = true;

      try {
        if (cart.length === 0) {
          throw new Error('Your cart is empty');
        }

        // Operating Hours Validation: 11:00 AM to 8:45 PM IST
        if (!isRestaurantOpen()) {
          setIsClosedModalOpen(true);
          throw new Error(RESTAURANT_CLOSED_MESSAGE);
        }

        const addonsTotal = cart.reduce((sum, item) => {
          const itemAddons = (item.addons || []).reduce((aSum, a) => aSum + a.price, 0);
          return sum + itemAddons * item.quantity;
        }, 0);

      const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
      const discountAmount = cartDiscount.discountTotal;

      // Delivery charge calculation
      let deliveryCharge = 0;
      const orderType = customer.orderType || 'delivery';
      if (orderType === 'delivery') {
        const configuredFee = data.settings.deliveryCharge ?? 0;
        const freeThreshold = data.settings.freeDeliveryThreshold ?? 0;
        if (configuredFee > 0) {
          if (freeThreshold > 0 && subtotal >= freeThreshold) {
            deliveryCharge = 0;
          } else {
            deliveryCharge = configuredFee;
          }
        }
      }

      const finalTotal = Math.max(0, subtotal + addonsTotal - discountAmount + deliveryCharge);
      const orderRef = 'OB-HD-' + Date.now().toString().slice(-6);

      const compositeAddress = [
        customer.houseFlat ? `Flat/House ${customer.houseFlat}` : '',
        customer.streetArea,
        customer.landmark ? `Near ${customer.landmark}` : '',
        customer.city || 'Motihari',
        customer.pincode ? `PIN: ${customer.pincode}` : '',
      ].filter(Boolean).join(', ');

      const orderPayload: Partial<CustomerOrder> = {
        id: orderRef,
        customerName: customer.customerName,
        customerPhone: customer.customerPhone,
        customerUid: firebaseUser?.uid || undefined,
        customerEmail: firebaseUser?.email || undefined,
        orderType,
        houseFlat: customer.houseFlat,
        streetArea: customer.streetArea,
        landmark: customer.landmark,
        city: customer.city || 'Motihari',
        pincode: customer.pincode || '845401',
        deliveryInstructions: customer.deliveryInstructions,
        deliveryAddress: customer.deliveryAddress || compositeAddress,
        tableNumber: customer.tableNumber,
        notes: customer.notes || customer.deliveryInstructions,
        items: cart,
        subtotal,
        addonsTotal,
        discountAmount: discountAmount > 0 ? discountAmount : undefined,
        appliedOfferTitle: discountAmount > 0 && appliedOffer ? appliedOffer.title : undefined,
        deliveryCharge,
        totalAmount: finalTotal,
        paymentMethod: 'pay_on_delivery',
        paymentStatus: 'unpaid',
        status: 'pending',
      };

      // Create order via API (authoritative server validation & persistent storage)
      let createdOrder: CustomerOrder | null = null;
      let apiSaved = false;
      try {
        createdOrder = await api.createOrder(orderPayload);
        apiSaved = true;
      } catch (err: any) {
        if (
          err?.code === 'RESTAURANT_CLOSED' ||
          err?.message?.includes('closed') ||
          err?.message?.includes('operating hours')
        ) {
          setIsClosedModalOpen(true);
          throw new Error(err.message || RESTAURANT_CLOSED_MESSAGE);
        }
        console.warn('Backend order store note:', err?.message);
      }

      if (!createdOrder) {
        createdOrder = {
          ...(orderPayload as CustomerOrder),
          id: orderRef,
          createdAt: new Date().toISOString(),
          status: 'pending',
          paymentStatus: 'unpaid',
          paymentMethod: 'pay_on_delivery',
        };
      }

      // Automatically save complete order details to Firebase Firestore
      let firestoreSaved = false;
      try {
        await saveOrderToFirestore(createdOrder, isAdmin);
        firestoreSaved = true;
      } catch (fsErr: any) {
        console.warn('Firestore order write note:', fsErr?.message);
      }

      // Strict reliability check: do not continue unless order was successfully saved
      if (!apiSaved && !firestoreSaved) {
        throw new Error('Unable to record order in database. Please check your connection and try again.');
      }

      const finalOrder = createdOrder;
      addLocalOrderId(finalOrder.id);
      setOrders(prev => {
        const filtered = prev.filter(o => o.id !== finalOrder.id);
        return [finalOrder, ...filtered];
      });
      setCustomerOrders(prev => {
        const filtered = prev.filter(o => o.id !== finalOrder.id);
        return [finalOrder, ...filtered];
      });

      // Build WhatsApp message formatted strictly as required
      let msg = `NEW HOME DELIVERY ORDER — ONE BITE\n\n`;
      msg += `Order Reference: ${createdOrder.id}\n\n`;
      msg += `CUSTOMER DETAILS\n`;
      msg += `Name: ${customer.customerName}\n`;
      msg += `Mobile: ${customer.customerPhone}\n\n`;
      msg += `DELIVERY ADDRESS\n`;
      msg += `House/Flat: ${customer.houseFlat || 'Not provided'}\n`;
      msg += `Street/Area: ${customer.streetArea || customer.deliveryAddress || 'Not provided'}\n`;
      msg += `Landmark: ${customer.landmark || 'None'}\n`;
      msg += `City: ${customer.city || 'Motihari'}\n`;
      msg += `PIN Code: ${customer.pincode || '845401'}\n`;
      msg += `Delivery Instructions: ${customer.deliveryInstructions || customer.notes || 'None'}\n\n`;
      msg += `ORDER ITEMS\n\n`;

      cart.forEach((item, idx) => {
        const variantText = item.variant ? ` — ${item.variant.name}` : '';
        const itemAddonsCost = (item.addons || []).reduce((sum, a) => sum + a.price, 0);
        const lineTotal = (item.unitPrice + itemAddonsCost) * item.quantity;
        msg += `${idx + 1}. ${item.name}${variantText}\n`;
        msg += `   Quantity: ${item.quantity}\n`;
        msg += `   Unit Price: ₹${item.unitPrice}\n`;
        msg += `   Line Total: ₹${lineTotal}\n\n`;
      });

      msg += `PAYMENT SUMMARY\n`;
      msg += `Subtotal: ₹${subtotal + addonsTotal}\n`;
      msg += `Discount: ₹${discountAmount}\n`;
      msg += `Delivery Charge: ₹${deliveryCharge}\n`;
      msg += `FINAL TOTAL: ₹${finalTotal}\n\n`;

      msg += `PAYMENT METHOD: PAY ON DELIVERY\n`;
      msg += `Payment Status: UNPAID\n`;
      msg += `Payment Options: Cash or Delivery Boy's QR Scanner\n`;
      msg += `Advance Payment: NOT REQUIRED\n\n`;

      msg += `Customer has reviewed the order and delivery details.\n\n`;
      msg += `Restaurant team: Please check item availability, delivery address, delivery feasibility, and total amount. Confirm the order and estimated delivery time with the customer on WhatsApp.`;

      const cleanPhone = (data.settings.whatsapp || '+918210442538').replace(/[^0-9]/g, '');
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;

      // Show attractive success celebration popup only after order is confirmed saved in Firebase
      triggerOrderCelebration(createdOrder, whatsappUrl);

      return {
        success: true,
        whatsappUrl,
        order: createdOrder,
      };
    } finally {
      isPlacingOrderRef.current = false;
    }
  },
  [cart, data.settings.whatsapp, data.settings.deliveryCharge, data.settings.freeDeliveryThreshold, cartDiscount, appliedOffer, isAdmin]
);

  // Admin Actions
  const handleLogin = async (email: string, pass: string) => {
    // Attempt Firebase Email & Password sign-in if configured in Firebase Auth
    try {
      const fbUser = await signInWithEmail(email, pass);
      if (fbUser) {
        setFirebaseUser(fbUser);
      }
    } catch (fbErr: any) {
      console.warn('Firebase email auth note:', fbErr?.message);
    }
    const res = await api.login(email, pass);
    setIsAdmin(true);
    setAdminUser(res.user);
    try {
      const ords = await api.getOrders();
      setOrders(ords);
    } catch (e) {
      console.warn('Orders fetch on login:', e);
    }
  };

  const handleLoginWithMagicToken = async (token: string) => {
    const res = await api.verifyLoginLink(token);
    setIsAdmin(true);
    setAdminUser(res.user);
    try {
      const ords = await api.getOrders();
      setOrders(ords);
    } catch (e) {
      console.warn('Orders fetch on magic login:', e);
    }
  };

  const loginWithGoogle = async (): Promise<{ user: User; isAdmin: boolean }> => {
    try {
      const user = await signInWithGoogle();
      setFirebaseUser(user);
      let isAdminVerified = false;

      try {
        // Securely verify admin identity on server before granting admin privileges
        const authRes = await api.loginFirebaseUser(user.email || undefined, user.phoneNumber || undefined);
        setIsAdmin(true);
        setAdminUser(authRes.user);
        isAdminVerified = true;
        try {
          const ords = await api.getOrders();
          setOrders(ords);
        } catch (e) {
          console.warn('Orders fetch on google sign-in:', e);
        }
      } catch {
        // Firebase user is not an administrator — user is authenticated as a customer!
        setIsAdmin(false);
        setAdminUser(null);
        isAdminVerified = false;
      }

      // Load customer orders for this user
      loadCustomerOrders();

      return { user, isAdmin: isAdminVerified };
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user') {
        throw new Error('Google sign-in was cancelled before completion.');
      }
      if (err?.code === 'auth/popup-blocked') {
        throw new Error('Sign-in popup was blocked by your browser. Please allow popups for this site and try again.');
      }
      if (err?.code === 'auth/network-request-failed') {
        throw new Error('Network error during Google sign-in. Please check your internet connection.');
      }
      throw err;
    }
  };

  const handleLoginWithMobile = async (phone: string, otp: string) => {
    const res = await api.verifyOtp(phone, otp);
    setIsAdmin(true);
    setAdminUser(res.user);
    try {
      const ords = await api.getOrders();
      setOrders(ords);
    } catch (e) {
      console.warn('Orders fetch on mobile login:', e);
    }
  };

  const handleLoginWithFirebasePhone = async (phone: string, user: User) => {
    const res = await api.loginPhone(phone, user.uid);
    setFirebaseUser(user);
    setIsAdmin(true);
    setAdminUser(res.user);
    try {
      const ords = await api.getOrders();
      setOrders(ords);
    } catch (e) {
      console.warn('Orders fetch on firebase phone login:', e);
    }
  };

  const handleCheckAdminPhone = async (phone: string) => {
    return await api.checkAdminPhone(phone);
  };

  const handleSendOtp = async (phone: string) => {
    return await api.sendOtp(phone);
  };

  const handleForgotPassword = async (email: string) => {
    return await api.forgotPassword(email);
  };

  const handleLogout = async () => {
    await api.logout();
    await signOutUser().catch(() => {});
    authStorage.clearToken();
    setIsAdmin(false);
    setAdminUser(null);
    setFirebaseUser(null);
  };

  const handleUpdateSettings = async (settingsData: Partial<SiteSettings>) => {
    const updated = await api.updateSettings(settingsData);
    setData(prev => ({ ...prev, settings: updated }));
  };

  const handleSaveCategory = async (categoryData: Partial<Category>) => {
    const saved = await api.saveCategory(categoryData);
    setData(prev => {
      const exists = prev.categories.some(c => c.id === saved.id);
      const categories = exists
        ? prev.categories.map(c => (c.id === saved.id ? saved : c))
        : [...prev.categories, saved];
      return {
        ...prev,
        categories: categories.sort((a, b) => a.displayOrder - b.displayOrder),
      };
    });
    return saved;
  };

  const handleDeleteCategory = async (id: string) => {
    await api.deleteCategory(id);
    setData(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c.id !== id),
    }));
  };

  const handleSaveMenuItem = async (itemData: Partial<MenuItem>) => {
    const saved = await api.saveMenuItem(itemData);
    setData(prev => {
      const exists = prev.menuItems.some(i => i.id === saved.id);
      const menuItems = exists
        ? prev.menuItems.map(i => (i.id === saved.id ? saved : i))
        : [...prev.menuItems, saved];
      return {
        ...prev,
        menuItems: menuItems.sort((a, b) => a.displayOrder - b.displayOrder),
      };
    });
    return saved;
  };

  const handleDeleteMenuItem = async (id: string) => {
    await api.deleteMenuItem(id);
    setData(prev => ({
      ...prev,
      menuItems: prev.menuItems.filter(i => i.id !== id),
    }));
  };

  const handleDuplicateMenuItem = async (id: string) => {
    const duplicated = await api.duplicateMenuItem(id);
    setData(prev => ({
      ...prev,
      menuItems: [...prev.menuItems, duplicated].sort((a, b) => a.displayOrder - b.displayOrder),
    }));
    return duplicated;
  };

  const handleSaveGalleryItem = async (photoData: Partial<GalleryItem>) => {
    const saved = await api.saveGalleryItem(photoData);
    setData(prev => {
      const exists = prev.gallery.some(g => g.id === saved.id);
      const gallery = exists
        ? prev.gallery.map(g => (g.id === saved.id ? saved : g))
        : [...prev.gallery, saved];
      return {
        ...prev,
        gallery: gallery.sort((a, b) => a.displayOrder - b.displayOrder),
      };
    });
    return saved;
  };

  const handleDeleteGalleryItem = async (id: string) => {
    await api.deleteGalleryItem(id);
    setData(prev => ({
      ...prev,
      gallery: prev.gallery.filter(g => g.id !== id),
    }));
  };

  const handleSaveReview = async (reviewData: Partial<ReviewItem>) => {
    const saved = await api.saveReview(reviewData);
    setData(prev => {
      const exists = prev.reviews.some(r => r.id === saved.id);
      const reviews = exists
        ? prev.reviews.map(r => (r.id === saved.id ? saved : r))
        : [saved, ...prev.reviews];
      return { ...prev, reviews };
    });
    return saved;
  };

  const handleDeleteReview = async (id: string) => {
    await api.deleteReview(id);
    setData(prev => ({
      ...prev,
      reviews: prev.reviews.filter(r => r.id !== id),
    }));
  };

  const handleSaveOffer = async (offerData: Partial<OfferItem>) => {
    const saved = await api.saveOffer(offerData);
    setData(prev => {
      const exists = prev.offers.some(o => o.id === saved.id);
      const offers = exists
        ? prev.offers.map(o => (o.id === saved.id ? saved : o))
        : [saved, ...prev.offers];
      return { ...prev, offers };
    });

    try {
      await setDoc(doc(db, 'offers', saved.id), saved);
    } catch (fsErr) {
      console.warn('Firestore offer sync error (non-fatal):', fsErr);
    }

    return saved;
  };

  const handleDeleteOffer = async (id: string) => {
    await api.deleteOffer(id);
    setData(prev => ({
      ...prev,
      offers: prev.offers.filter(o => o.id !== id),
    }));

    try {
      await deleteDoc(doc(db, 'offers', id));
    } catch (fsErr) {
      console.warn('Firestore offer delete error (non-fatal):', fsErr);
    }
  };

  const handleSaveBusinessHours = async (hours: BusinessDayHours[]) => {
    const saved = await api.updateBusinessHours(hours);
    setData(prev => ({ ...prev, businessHours: saved }));
  };

  const handleUploadImage = async (imgData: string, filename?: string) => {
    return await api.uploadImage(imgData, filename);
  };

  const handleResetToDefaults = async () => {
    await api.resetData();
    await loadData();
  };

  const handleUpdateOrderStatus = async (
    id: string,
    status: CustomerOrder['status'],
    paymentStatus?: 'unpaid' | 'paid',
    note?: string
  ) => {
    // 1. Authoritative Firestore transactional update
    await updateOrderStatusInFirestore(id, status, {
      note,
      paymentStatus,
      updatedBy: adminUser?.identifier || auth.currentUser?.email || 'Admin',
      updaterId: auth.currentUser?.email || adminUser?.identifier || 'admin',
    });

    // 2. Synchronize to server API
    let updated: CustomerOrder | null = null;
    try {
      updated = await api.updateOrderStatus(id, status, paymentStatus, note);
    } catch (e) {
      console.warn('Backend server status update sync note:', e);
    }

    // 3. Immediately reflect in local React context
    const nowIso = new Date().toISOString();
    const updateFn = (prev: CustomerOrder[]): CustomerOrder[] =>
      prev.map(o => {
        if (o.id !== id) return o;
        const currentHist = Array.isArray(o.statusHistory) ? [...o.statusHistory] : [];
        const isDuplicateHist = currentHist.some(h => h.status === status && Math.abs(new Date(h.timestamp).getTime() - Date.now()) < 5000);
        const newHist = isDuplicateHist
          ? currentHist
          : [
              ...currentHist,
              {
                status,
                statusName: getStatusDisplayName(status),
                timestamp: nowIso,
                updatedBy: adminUser?.identifier || 'Admin',
                note,
              },
            ];

        const updatedOrder: CustomerOrder = {
          ...o,
          ...(updated || {}),
          status,
          updatedAt: nowIso,
          ...(status === 'packed' ? { packedAt: o.packedAt || nowIso, deliveryStatus: 'Packed' } : {}),
          ...(status === 'out_for_delivery'
            ? {
                outForDeliveryAt: o.outForDeliveryAt || nowIso,
                startedDeliveryAt: o.startedDeliveryAt || nowIso,
                deliveryStatus: 'Out for Delivery',
              }
            : {}),
          ...(status === 'delivered'
            ? {
                deliveredAt: o.deliveredAt || nowIso,
                deliveryStatus: 'Delivered',
                paymentStatus: 'paid' as const,
              }
            : {}),
          ...(paymentStatus ? { paymentStatus } : {}),
          statusHistory: newHist,
        };
        return updatedOrder;
      });

    setOrders(updateFn);
    setCustomerOrders(updateFn);
  };

  const handleUpdateOrderPaymentStatus = async (id: string, paymentStatus: 'unpaid' | 'paid') => {
    const updated = await api.updateOrderPaymentStatus(id, paymentStatus);
    try {
      const orderDocRef = doc(db, 'orders', id);
      await setDoc(orderDocRef, { paymentStatus }, { merge: true });
    } catch (fsErr: any) {
      console.warn('Firestore payment update note:', fsErr?.message);
    }
    setOrders(prev => prev.map(o => (o.id === id ? { ...o, ...updated, paymentStatus } : o)));
  };

  const handleAssignOrderToDeliveryBoy = async (orderId: string) => {
    const updated = await api.assignOrder(orderId);
    try {
      await assignOrderInFirestore(orderId, {
        assignedAt: updated.assignedAt,
        assignedBy: updated.assignedBy || 'Admin',
      });
    } catch (fsErr: any) {
      console.warn('Firestore assign note:', fsErr?.message);
    }
    setOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, ...updated, assignedToDeliveryBoy: true, deliveryStatus: 'Assigned' } : o))
    );
  };

  const handleUnassignOrderFromDeliveryBoy = async (orderId: string) => {
    const updated = await api.unassignOrder(orderId);
    try {
      await unassignOrderInFirestore(orderId);
    } catch (fsErr: any) {
      console.warn('Firestore unassign note:', fsErr?.message);
    }
    setOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, ...updated, assignedToDeliveryBoy: false, deliveryStatus: 'Pending' } : o))
    );
  };

  const handleCreateManualOrder = async (orderData: Partial<CustomerOrder>, assignImmediately = true) => {
    const payload = {
      ...orderData,
      assignedToDeliveryBoy: assignImmediately,
      orderType: 'delivery' as const,
      status: (assignImmediately ? 'confirmed' : 'pending') as CustomerOrder['status'],
      deliveryStatus: assignImmediately ? 'Assigned' : 'Pending',
    };
    const created = await api.createOrder(payload);
    try {
      await saveOrderToFirestore(created);
    } catch (fsErr: any) {
      console.warn('Firestore manual order note:', fsErr?.message);
    }
    setOrders(prev => [created, ...prev.filter(o => o.id !== created.id)]);
    return created;
  };

  return (
    <RestaurantContext.Provider
      value={{
        settings: data.settings,
        categories: data.categories,
        menuItems: data.menuItems,
        gallery: data.gallery,
        reviews: data.reviews,
        offers: data.offers,
        businessHours: data.businessHours,
        orders,
        isLoading,
        error,
        isAdmin,
        adminUser,
        customerOrders,
        customerOrdersLoading,
        loadCustomerOrders,
        authInitialized,
        openStatus,
        isClosedModalOpen,
        setIsClosedModalOpen,
        popularItems,
        activeOffers,
        cart,
        cartCount,
        cartTotal,
        appliedOffer,
        applyOffer,
        removeOffer,
        cartDiscount,
        isCartOpen,
        setIsCartOpen,
        selectedVariantItem,
        setSelectedVariantItem,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        placeOrder,
        refreshData: loadData,
        setIsAdmin,
        setAdminUser,
        loginWithMagicToken: handleLoginWithMagicToken,
        login: handleLogin,
        loginWithGoogle,
        loginWithMobile: handleLoginWithMobile,
        loginWithFirebasePhone: handleLoginWithFirebasePhone,
        checkAdminPhone: handleCheckAdminPhone,
        sendOtp: handleSendOtp,
        forgotPassword: handleForgotPassword,
        logout: handleLogout,
        firebaseUser,
        updateSettings: handleUpdateSettings,
        saveCategory: handleSaveCategory,
        deleteCategory: handleDeleteCategory,
        saveMenuItem: handleSaveMenuItem,
        deleteMenuItem: handleDeleteMenuItem,
        duplicateMenuItem: handleDuplicateMenuItem,
        saveGalleryItem: handleSaveGalleryItem,
        deleteGalleryItem: handleDeleteGalleryItem,
        saveReview: handleSaveReview,
        deleteReview: handleDeleteReview,
        saveOffer: handleSaveOffer,
        deleteOffer: handleDeleteOffer,
        saveBusinessHours: handleSaveBusinessHours,
        uploadImage: handleUploadImage,
        resetToDefaults: handleResetToDefaults,
        updateOrderStatus: handleUpdateOrderStatus,
        updateOrderPaymentStatus: handleUpdateOrderPaymentStatus,
        assignOrderToDeliveryBoy: handleAssignOrderToDeliveryBoy,
        unassignOrderFromDeliveryBoy: handleUnassignOrderFromDeliveryBoy,
        createManualOrder: handleCreateManualOrder,
        celebrationOrder,
        celebrationWhatsappUrl,
        triggerOrderCelebration,
        dismissOrderCelebration,
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurant() {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
}
