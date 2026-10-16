import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
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
  signOutUser,
  handleFirestoreError,
  OperationType,
  User,
} from '../services/firebase.ts';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import {
  isOfferPubliclyActive,
  calculateCartDiscount,
  CartDiscountResult,
} from '../utils/offerUtils.ts';

interface OpenStatus {
  isOpen: boolean;
  statusText: string;
  todayScheduleText: string;
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
  adminUser: { email: string; role: string } | null;
  openStatus: OpenStatus;

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

  // Admin Actions
  refreshData: () => Promise<void>;
  login: (email: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
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
  updateOrderStatus: (id: string, status: CustomerOrder['status'], paymentStatus?: 'unpaid' | 'paid') => Promise<void>;
  updateOrderPaymentStatus: (id: string, paymentStatus: 'unpaid' | 'paid') => Promise<void>;
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
  const [adminUser, setAdminUser] = useState<{ email: string; role: string } | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        setIsAdmin(true);
        setAdminUser({ email: user.email || 'Admin', role: 'admin' });
        try {
          const ords = await api.getOrders();
          setOrders(ords);
        } catch (e) {
          console.warn('Orders fetch on auth sync:', e);
        }
      }
    });
    return () => unsub();
  }, []);

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
  const [selectedVariantItem, setSelectedVariantItem] = useState<MenuItem | null>(null);
  const [appliedOffer, setAppliedOffer] = useState<OfferItem | null>(null);

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

  // Compute live open status for IST (India Standard Time)
  const openStatus = useMemo((): OpenStatus => {
    try {
      const now = new Date();
      const dayFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        weekday: 'long',
      });
      const hourFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
      });

      const currentDay = dayFormatter.format(now) as BusinessDayHours['day'];
      const timeParts = hourFormatter.format(now).split(':');
      const currentMinutes = parseInt(timeParts[0], 10) * 60 + parseInt(timeParts[1], 10);

      const dayConfig = data.businessHours.find(h => h.day.toLowerCase() === currentDay.toLowerCase());

      if (!dayConfig || dayConfig.closed) {
        return {
          isOpen: false,
          statusText: 'Closed Today',
          todayScheduleText: 'Closed today',
        };
      }

      const [openH, openM] = dayConfig.openTime.split(':').map(Number);
      const [closeH, closeM] = dayConfig.closeTime.split(':').map(Number);
      const openMinutes = openH * 60 + (openM || 0);
      const closeMinutes = closeH * 60 + (closeM || 0);

      const scheduleFormatted = `${format12Hour(dayConfig.openTime)} – ${format12Hour(dayConfig.closeTime)}`;

      if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
        return {
          isOpen: true,
          statusText: `Open Now · Closes at ${format12Hour(dayConfig.closeTime)}`,
          todayScheduleText: scheduleFormatted,
        };
      } else {
        const isBeforeOpening = currentMinutes < openMinutes;
        return {
          isOpen: false,
          statusText: isBeforeOpening
            ? `Opens Today at ${format12Hour(dayConfig.openTime)}`
            : 'Closed for the Night',
          todayScheduleText: scheduleFormatted,
        };
      }
    } catch {
      return {
        isOpen: true,
        statusText: 'Open Daily',
        todayScheduleText: '11:00 AM – 10:00 PM',
      };
    }
  }, [data.businessHours]);

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
      if (cart.length === 0) {
        throw new Error('Your cart is empty');
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

      // Create order via API
      let createdOrder: CustomerOrder;
      try {
        createdOrder = await api.createOrder(orderPayload);
        setOrders(prev => [createdOrder, ...prev]);
      } catch (err) {
        console.warn('Backend order store failed, using fallback object:', err);
        createdOrder = {
          ...(orderPayload as CustomerOrder),
          id: orderRef,
          createdAt: new Date().toISOString(),
        };
        setOrders(prev => [createdOrder, ...prev]);
      }

      // Also persist order to Firestore
      try {
        await setDoc(doc(db, 'orders', createdOrder.id), createdOrder);
      } catch (fsErr) {
        console.warn('Firestore order write error (non-fatal):', fsErr);
      }

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

      // NOTE: Do not automatically clear cart just because WhatsApp opens,
      // as required by user prompt instructions.

      return {
        success: true,
        whatsappUrl,
        order: createdOrder,
      };
    },
    [cart, data.settings.whatsapp, data.settings.deliveryCharge, data.settings.freeDeliveryThreshold, cartDiscount, appliedOffer]
  );

  // Admin Actions
  const handleLogin = async (email: string, pass: string) => {
    const res = await api.login(email, pass);
    setIsAdmin(true);
    setAdminUser(res.user);
    const ords = await api.getOrders();
    setOrders(ords);
  };

  const loginWithGoogle = async () => {
    try {
      const user = await signInWithGoogle();
      setFirebaseUser(user);
      setIsAdmin(true);
      setAdminUser({ email: user.email || 'Admin', role: 'admin' });
      try {
        const ords = await api.getOrders();
        setOrders(ords);
      } catch (e) {
        console.warn('Orders fetch on google sign-in:', e);
      }
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user') {
        throw new Error('Google sign-in was cancelled.');
      }
      handleFirestoreError(err, OperationType.GET, 'auth');
    }
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

  const handleUpdateOrderStatus = async (id: string, status: CustomerOrder['status'], paymentStatus?: 'unpaid' | 'paid') => {
    const updated = await api.updateOrderStatus(id, status, paymentStatus);
    setOrders(prev => prev.map(o => (o.id === id ? updated : o)));
  };

  const handleUpdateOrderPaymentStatus = async (id: string, paymentStatus: 'unpaid' | 'paid') => {
    const updated = await api.updateOrderPaymentStatus(id, paymentStatus);
    setOrders(prev => prev.map(o => (o.id === id ? updated : o)));
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
        openStatus,
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
        login: handleLogin,
        loginWithGoogle,
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
