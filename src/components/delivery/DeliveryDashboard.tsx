import React, { useState, useEffect, useCallback } from 'react';
import { api, deliveryAuthStorage } from '../../services/api.ts';
import {
  db,
  collection,
  onSnapshot,
  markOrderDeliveredInFirestore,
  markOrderOutForDeliveryInFirestore,
  signOutUser,
} from '../../services/firebase.ts';
import { CustomerOrder } from '../../types/index.ts';
import { useToast } from '../common/Toast.tsx';
import { OneBiteLogo } from '../common/OneBiteLogo.tsx';
import {
  Truck,
  Phone,
  CheckCircle2,
  Clock,
  MapPin,
  User,
  ShoppingBag,
  RefreshCw,
  LogOut,
  AlertCircle,
  Search,
  Check,
  X,
  ChefHat,
  Filter,
  DollarSign,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

interface DeliveryDashboardProps {
  onLogout: () => void;
  onViewLiveSite: () => void;
}

export const DeliveryDashboard: React.FC<DeliveryDashboardProps> = ({
  onLogout,
  onViewLiveSite,
}) => {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'assigned' | 'out_for_delivery' | 'delivered' | 'all'>('assigned');

  // Confirmation Modal State
  const [confirmingOrder, setConfirmingOrder] = useState<CustomerOrder | null>(null);
  const [isSubmittingDelivery, setIsSubmittingDelivery] = useState(false);
  const [startingDeliveryId, setStartingDeliveryId] = useState<string | null>(null);

  // Delivery partner session identifier
  const [deliveryIdentifier, setDeliveryIdentifier] = useState<string>('delivery@onebitemotihari.in');

  // Load orders helper
  const mergeAndSortOrders = useCallback((newOrders: CustomerOrder[]) => {
    setOrders(prev => {
      const orderMap = new Map<string, CustomerOrder>();
      prev.forEach(o => orderMap.set(o.id, o));
      newOrders.forEach(o => orderMap.set(o.id, o));
      const merged = Array.from(orderMap.values());
      merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return merged;
    });
  }, []);

  const fetchOrdersFromServer = useCallback(async (quiet = false) => {
    if (!quiet) setIsRefreshing(true);
    try {
      const fetched = await api.getDeliveryOrders();
      if (Array.isArray(fetched)) {
        mergeAndSortOrders(fetched);
      }
    } catch (err: any) {
      if (!quiet) {
        showToast(err?.message || 'Failed to refresh orders from server', 'error');
      }
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  }, [mergeAndSortOrders, showToast]);

  // Real-Time Firestore Synchronization + Polling
  useEffect(() => {
    let isMounted = true;

    // Check delivery auth
    api.checkDeliveryAuth().then(authed => {
      if (!authed && !deliveryAuthStorage.getToken()) {
        onLogout();
      }
    });

    // 1. Initial server fetch
    fetchOrdersFromServer(true);

    // 2. Real-Time Firestore onSnapshot listener
    let unsubFirestore: (() => void) | null = null;
    try {
      const ordersCol = collection(db, 'orders');
      unsubFirestore = onSnapshot(
        ordersCol,
        snapshot => {
          if (!isMounted) return;
          const fbOrders: CustomerOrder[] = [];
          snapshot.forEach(docSnap => {
            const data = docSnap.data() as CustomerOrder;
            fbOrders.push({ ...data, id: docSnap.id });
          });
          if (fbOrders.length > 0) {
            mergeAndSortOrders(fbOrders);
          }
        },
        error => {
          console.warn('Firestore delivery onSnapshot notice:', error?.message);
        }
      );
    } catch (e) {
      console.warn('Could not attach Firestore delivery listener:', e);
    }

    // 3. Periodic continuous sync polling as reliable backup every 3.5 seconds
    const interval = setInterval(() => {
      if (isMounted) fetchOrdersFromServer(true);
    }, 3500);

    return () => {
      isMounted = false;
      if (unsubFirestore) unsubFirestore();
      clearInterval(interval);
    };
  }, [fetchOrdersFromServer, mergeAndSortOrders, onLogout]);

  // Handle Start Delivery Action (Action C)
  const handleStartDelivery = async (order: CustomerOrder) => {
    if (!order || startingDeliveryId) return;
    setStartingDeliveryId(order.id);

    try {
      const startedAt = new Date().toISOString();

      // 1. Update in Firebase Firestore for immediate real-time sync with Admin panel
      try {
        await markOrderOutForDeliveryInFirestore(order.id, startedAt);
      } catch (fsErr: any) {
        console.warn('Firestore out-for-delivery write note:', fsErr?.message);
      }

      // 2. Update via server backend authoritative endpoint
      const updatedOrder = await api.startOrderDelivery(order.id);

      // 3. Update local state immediately
      setOrders(prev =>
        prev.map(o =>
          o.id === order.id
            ? {
                ...o,
                ...updatedOrder,
                status: 'out_for_delivery',
                deliveryStatus: 'Out for Delivery',
                startedDeliveryAt: startedAt,
              }
            : o
        )
      );

      showToast(`🚚 Order ${order.id} is now OUT FOR DELIVERY!`, 'success');
      setActiveTab('out_for_delivery');
    } catch (err: any) {
      showToast(err?.message || 'Failed to start delivery. Please try again.', 'error');
    } finally {
      setStartingDeliveryId(null);
    }
  };

  // Handle Confirm Delivery Action (Action D)
  const handleConfirmDelivery = async (order: CustomerOrder) => {
    if (!order) return;
    setIsSubmittingDelivery(true);

    try {
      const deliveredTimestamp = new Date().toISOString();
      const identifier = deliveryIdentifier || 'delivery@onebitemotihari.in';

      // 1. Update in Firebase Firestore for immediate real-time sync with Admin panel
      try {
        await markOrderDeliveredInFirestore(order.id, {
          deliveredBy: identifier,
          deliveredAt: deliveredTimestamp,
        });
      } catch (fsErr: any) {
        console.warn('Firestore delivery write note:', fsErr?.message);
      }

      // 2. Update via server backend authoritative endpoint
      const updatedOrder = await api.confirmOrderDelivered(order.id);

      // 3. Update local state immediately
      setOrders(prev =>
        prev.map(o =>
          o.id === order.id
            ? {
                ...o,
                ...updatedOrder,
                status: 'delivered',
                deliveryStatus: 'Delivered',
                deliveredAt: deliveredTimestamp,
                deliveredBy: identifier,
              }
            : o
        )
      );

      showToast(`🎉 Order ${order.id} marked as Delivered!`, 'success');
      setConfirmingOrder(null);
      setActiveTab('delivered');
    } catch (err: any) {
      showToast(err?.message || 'Failed to confirm delivery. Please try again.', 'error');
    } finally {
      setIsSubmittingDelivery(false);
    }
  };

  const handleLogoutClick = async () => {
    try {
      await api.deliveryLogout();
      await signOutUser();
    } catch {}
    deliveryAuthStorage.clearToken();
    onLogout();
  };

  // Filter orders by tab and search
  const filteredOrders = orders.filter(order => {
    // Only delivery orders
    if (order.orderType && order.orderType !== 'delivery') return false;

    const isDelivered =
      order.status === 'delivered' ||
      order.status === 'completed' ||
      order.deliveryStatus === 'Delivered';
    const isOutForDelivery = order.status === 'out_for_delivery';
    const isAssigned = Boolean(order.assignedToDeliveryBoy || order.deliveryStatus === 'Assigned');

    // Tab filter:
    if (activeTab === 'assigned') {
      // New / assigned orders awaiting pickup or active
      if (isDelivered || order.status === 'cancelled') return false;
      if (!isAssigned && !isOutForDelivery) return false;
    } else if (activeTab === 'out_for_delivery') {
      if (!isOutForDelivery) return false;
    } else if (activeTab === 'delivered') {
      if (!isDelivered) return false;
    }

    // Search query
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const idMatch = (order.id || '').toLowerCase().includes(q);
    const nameMatch = (order.customerName || '').toLowerCase().includes(q);
    const phoneMatch = (order.customerPhone || '').toLowerCase().includes(q);
    const addressMatch = (order.deliveryAddress || '').toLowerCase().includes(q);
    return idMatch || nameMatch || phoneMatch || addressMatch;
  });

  const assignedCount = orders.filter(
    o =>
      (!o.orderType || o.orderType === 'delivery') &&
      (o.assignedToDeliveryBoy || o.deliveryStatus === 'Assigned' || o.status === 'out_for_delivery') &&
      o.status !== 'delivered' &&
      o.status !== 'completed' &&
      o.status !== 'cancelled' &&
      o.deliveryStatus !== 'Delivered'
  ).length;

  const outForDeliveryCount = orders.filter(
    o => o.status === 'out_for_delivery'
  ).length;

  const deliveredCount = orders.filter(
    o => o.status === 'delivered' || o.status === 'completed' || o.deliveryStatus === 'Delivered'
  ).length;

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 pb-16 selection:bg-amber-600 selection:text-white">
      {/* Top Mobile-First Header */}
      <header className="sticky top-0 z-40 bg-stone-950 text-white border-b border-stone-800 shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <OneBiteLogo size="sm" />
            <div className="border-l border-stone-800 pl-2.5">
              <div className="flex items-center gap-1.5 text-xs font-black text-amber-400">
                <Truck className="w-4 h-4 text-amber-500" />
                <span>DELIVERY BOY PANEL</span>
              </div>
              <span className="text-[10px] text-stone-400 block font-medium truncate max-w-[170px] sm:max-w-none">
                One Bite Motihari · Live Order Sync
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchOrdersFromServer(false)}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-800 transition-colors cursor-pointer"
              title="Refresh Orders"
              aria-label="Refresh orders"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
            </button>

            <button
              type="button"
              onClick={handleLogoutClick}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800/80 text-xs font-bold transition-colors cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 pt-4 sm:pt-6 space-y-4">
        {/* Status Counts Banner */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('assigned')}
            className={`p-3 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              activeTab === 'assigned'
                ? 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-500/40'
                : 'bg-white text-stone-800 border-stone-200 hover:border-amber-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider ${activeTab === 'assigned' ? 'text-amber-100' : 'text-stone-500'}`}>
                Active Tasks
              </span>
              <Truck className={`w-3.5 h-3.5 ${activeTab === 'assigned' ? 'text-white' : 'text-amber-600'}`} />
            </div>
            <div className="text-xl sm:text-3xl font-black">{assignedCount}</div>
            <span className={`text-[9px] sm:text-[10px] font-medium block mt-0.5 truncate ${activeTab === 'assigned' ? 'text-amber-100' : 'text-stone-500'}`}>
              Assigned to you
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('out_for_delivery')}
            className={`p-3 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              activeTab === 'out_for_delivery'
                ? 'bg-sky-600 text-white border-sky-600 shadow-md ring-2 ring-sky-500/40'
                : 'bg-white text-stone-800 border-stone-200 hover:border-sky-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider ${activeTab === 'out_for_delivery' ? 'text-sky-100' : 'text-stone-500'}`}>
                On the Way
              </span>
              <Clock className={`w-3.5 h-3.5 ${activeTab === 'out_for_delivery' ? 'text-white' : 'text-sky-600'}`} />
            </div>
            <div className="text-xl sm:text-3xl font-black">{outForDeliveryCount}</div>
            <span className={`text-[9px] sm:text-[10px] font-medium block mt-0.5 truncate ${activeTab === 'out_for_delivery' ? 'text-sky-100' : 'text-stone-500'}`}>
              Out for delivery
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('delivered')}
            className={`p-3 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              activeTab === 'delivered'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500/40'
                : 'bg-white text-stone-800 border-stone-200 hover:border-emerald-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider ${activeTab === 'delivered' ? 'text-emerald-100' : 'text-stone-500'}`}>
                Delivered
              </span>
              <CheckCircle2 className={`w-3.5 h-3.5 ${activeTab === 'delivered' ? 'text-white' : 'text-emerald-600'}`} />
            </div>
            <div className="text-xl sm:text-3xl font-black">{deliveredCount}</div>
            <span className={`text-[9px] sm:text-[10px] font-medium block mt-0.5 truncate ${activeTab === 'delivered' ? 'text-emerald-100' : 'text-stone-500'}`}>
              Completed history
            </span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by order ID, customer name, phone, or address..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white text-xs sm:text-sm border border-stone-200 rounded-2xl shadow-xs focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-xs font-bold cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1 p-1 bg-stone-200/80 rounded-xl text-xs font-bold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('assigned')}
            className={`flex-1 py-1.5 px-2 rounded-lg transition-colors cursor-pointer text-center whitespace-nowrap ${
              activeTab === 'assigned'
                ? 'bg-white text-amber-800 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Assigned Tasks ({assignedCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('out_for_delivery')}
            className={`flex-1 py-1.5 px-2 rounded-lg transition-colors cursor-pointer text-center whitespace-nowrap ${
              activeTab === 'out_for_delivery'
                ? 'bg-white text-sky-800 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            On the Way ({outForDeliveryCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('delivered')}
            className={`flex-1 py-1.5 px-2 rounded-lg transition-colors cursor-pointer text-center whitespace-nowrap ${
              activeTab === 'delivered'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Delivered ({deliveredCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-1.5 px-2 rounded-lg transition-colors cursor-pointer text-center whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            All Orders ({orders.length})
          </button>
        </div>

        {/* Orders List */}
        {isLoading ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-stone-200 shadow-xs">
            <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs sm:text-sm font-semibold text-stone-600">
              Loading orders from One Bite database...
            </p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-stone-200 shadow-xs space-y-3">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto">
              <Truck className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-stone-900">
              {activeTab === 'assigned'
                ? 'No Pending Deliveries'
                : activeTab === 'out_for_delivery'
                ? 'No Orders Out for Delivery'
                : 'No Orders Found'}
            </h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              {activeTab === 'assigned'
                ? 'When the restaurant admin assigns a home delivery order, it will appear here in real time automatically.'
                : 'No orders match your current filter or search criteria.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map(order => {
              const isDelivered =
                order.status === 'delivered' ||
                order.status === 'completed' ||
                order.deliveryStatus === 'Delivered';
              const isOutForDelivery = order.status === 'out_for_delivery';
              const isPaid = order.paymentStatus === 'paid';
              const cleanCustomerPhone = (order.customerPhone || '').replace(/[^0-9+]/g, '');
              const isStarting = startingDeliveryId === order.id;

              return (
                <div
                  key={order.id}
                  className={`bg-white rounded-3xl border shadow-xs overflow-hidden transition-all ${
                    isDelivered
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : isOutForDelivery
                      ? 'border-sky-300 ring-2 ring-sky-500/20'
                      : 'border-stone-200 hover:border-amber-400'
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-4 sm:p-5 border-b border-stone-100 flex flex-wrap items-center justify-between gap-2.5 bg-stone-50/70">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-black text-sm text-stone-900 bg-white border border-stone-200 px-3 py-1 rounded-xl shadow-2xs">
                        {order.id}
                      </span>
                      {isDelivered ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>DELIVERED</span>
                        </span>
                      ) : isOutForDelivery ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-sky-100 text-sky-800 animate-pulse">
                          <Truck className="w-3.5 h-3.5" />
                          <span>OUT FOR DELIVERY</span>
                        </span>
                      ) : order.status === 'cancelled' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-rose-100 text-rose-800">
                          <X className="w-3.5 h-3.5" />
                          <span>CANCELLED</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-amber-100 text-amber-900">
                          <Clock className="w-3.5 h-3.5" />
                          <span>ASSIGNED · AWAITING DISPATCH</span>
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] font-semibold text-stone-500">
                      Placed: {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} · {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 sm:p-5 space-y-4 text-xs">
                    {/* Customer Info (Action A: View Order) */}
                    <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-amber-600" />
                          <span className="text-sm font-extrabold text-stone-900">
                            {order.customerName}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-stone-600">
                          {order.customerPhone}
                        </span>
                      </div>

                      {/* Delivery Address */}
                      <div className="flex items-start gap-2 pt-1 border-t border-stone-200/70">
                        <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <div className="leading-relaxed">
                          <span className="font-bold text-stone-900 block text-xs">
                            Full Home Delivery Address:
                          </span>
                          <span className="text-stone-800 font-medium text-xs sm:text-sm">
                            {order.deliveryAddress ||
                              [order.houseFlat, order.streetArea, order.landmark, order.city, order.pincode]
                                .filter(Boolean)
                                .join(', ')}
                          </span>
                        </div>
                      </div>

                      {/* Delivery instructions callout if present */}
                      {order.deliveryInstructions && (
                        <div className="mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 font-medium flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div className="text-[11px]">
                            <span className="font-bold block">Delivery Note:</span>
                            {order.deliveryInstructions}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Ordered Items Summary */}
                    <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-stone-700 pb-1.5 border-b border-stone-100">
                        <span className="uppercase tracking-wider">Ordered Food Items ({(order.items || []).length})</span>
                        <span>Amount</span>
                      </div>
                      <div className="space-y-1.5 divide-y divide-stone-100 max-h-40 overflow-y-auto">
                        {(order.items || []).map((item, idx) => (
                          <div key={idx} className="pt-1.5 first:pt-0 flex justify-between items-center text-xs">
                            <div className="flex items-center gap-1.5 font-medium text-stone-800">
                              <span className="w-5 h-5 rounded-md bg-stone-100 text-stone-700 text-[11px] font-bold flex items-center justify-center">
                                {item.quantity}×
                              </span>
                              <span>{item.name}</span>
                              {item.variant && (
                                <span className="text-[10px] text-amber-700 font-semibold">
                                  ({item.variant.name})
                                </span>
                              )}
                            </div>
                            <span className="font-bold text-stone-900">
                              ₹{item.unitPrice * item.quantity}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Payment Summary */}
                      <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-xs sm:text-sm font-black text-stone-900">
                        <div className="flex items-center gap-2">
                          <span>Pay on Delivery:</span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                              isPaid
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-900'
                            }`}
                          >
                            {isPaid ? 'PAID' : 'COLLECT CASH OR SCAN QR'}
                          </span>
                        </div>
                        <span className="text-amber-700 text-base font-black">
                          ₹{order.totalAmount}
                        </span>
                      </div>
                    </div>

                    {/* Delivery Audit Info (if already delivered) */}
                    {isDelivered && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-[11px] text-emerald-950 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 font-bold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Delivery Confirmed & Synchronized with Admin</span>
                        </div>
                        <div className="text-emerald-800 font-medium">
                          {order.deliveredAt && `Delivered: ${new Date(order.deliveredAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`}
                          {order.deliveredBy && ` by ${order.deliveredBy}`}
                        </div>
                      </div>
                    )}

                    {/* Mobile-First Interactive Action Buttons (Actions B, C, D) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                      {/* Action B: Call Customer */}
                      <a
                        href={`tel:${cleanCustomerPhone}`}
                        className="w-full py-3 px-3 rounded-2xl bg-stone-900 hover:bg-stone-800 active:bg-black text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                        title={`Call customer ${order.customerName} on ${order.customerPhone}`}
                      >
                        <Phone className="w-4 h-4 text-amber-400" />
                        <span>Call Customer</span>
                      </a>

                      {/* Action C: Start Delivery (if not yet out for delivery and not delivered) */}
                      {!isDelivered && !isOutForDelivery && order.status !== 'cancelled' ? (
                        <button
                          type="button"
                          disabled={isStarting}
                          onClick={() => handleStartDelivery(order)}
                          className="w-full py-3 px-3 rounded-2xl bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-sky-600/25 transition-all cursor-pointer transform active:scale-[0.98]"
                        >
                          <Truck className="w-4 h-4" />
                          <span>{isStarting ? 'Updating...' : 'Start Delivery'}</span>
                        </button>
                      ) : null}

                      {/* Action D: Confirm Delivery (prominent when out for delivery or active) */}
                      {!isDelivered && order.status !== 'cancelled' ? (
                        <button
                          type="button"
                          onClick={() => setConfirmingOrder(order)}
                          className={`w-full py-3 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/25 transition-all cursor-pointer transform active:scale-[0.98] ${
                            !isOutForDelivery ? '' : 'sm:col-span-2'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Confirm Delivery</span>
                        </button>
                      ) : isDelivered ? (
                        <div className="sm:col-span-2 w-full py-3 px-4 rounded-2xl bg-emerald-100 text-emerald-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-emerald-300">
                          <Check className="w-4 h-4" />
                          <span>Order Delivered</span>
                        </div>
                      ) : (
                        <div className="sm:col-span-2 w-full py-3 px-4 rounded-2xl bg-stone-200 text-stone-500 font-bold text-xs flex items-center justify-center">
                          Cancelled
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Confirmation Modal */}
      {confirmingOrder && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => {
            if (!isSubmittingDelivery) setConfirmingOrder(null);
          }}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-stone-200 text-center space-y-4 animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Truck className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-stone-900">
                Confirm Doorstep Delivery?
              </h3>
              <p className="text-xs text-stone-600">
                Have you physically delivered the food package to the customer and collected the payable amount?
              </p>
            </div>

            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-left text-xs space-y-1.5">
              <div className="flex justify-between font-bold text-stone-900">
                <span>Order Reference:</span>
                <span className="font-mono text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                  {confirmingOrder.id}
                </span>
              </div>
              <div className="flex justify-between text-stone-700">
                <span>Customer Name:</span>
                <span className="font-semibold">{confirmingOrder.customerName}</span>
              </div>
              <div className="flex justify-between text-stone-700">
                <span>Mobile:</span>
                <span className="font-semibold">{confirmingOrder.customerPhone}</span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-stone-200 font-extrabold text-sm text-stone-950">
                <span>Total Amount to Collect:</span>
                <span className="text-amber-700 font-black">₹{confirmingOrder.totalAmount}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                disabled={isSubmittingDelivery}
                onClick={() => setConfirmingOrder(null)}
                className="py-3 px-4 rounded-xl border border-stone-300 hover:bg-stone-100 font-bold text-xs text-stone-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingDelivery}
                onClick={() => handleConfirmDelivery(confirmingOrder)}
                className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white font-extrabold text-xs shadow-md shadow-emerald-600/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                {isSubmittingDelivery ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Yes, Confirm</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
