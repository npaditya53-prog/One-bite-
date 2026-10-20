import React, { useState, useEffect } from 'react';
import { useRestaurant } from '../../context/RestaurantContext.tsx';
import { CustomerOrder } from '../../types/index.ts';
import { OrderTrackingModal } from './OrderTrackingModal.tsx';
import { CustomerOnboardingModal } from '../auth/CustomerOnboardingModal.tsx';
import {
  ShoppingBag,
  Clock,
  ArrowRight,
  RotateCw,
  MapPin,
  UtensilsCrossed,
  CheckCircle2,
  PackageCheck,
  Truck,
  AlertCircle,
  LogIn,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface MyOrdersPageProps {
  onBackToMenu: () => void;
  onNavigateHome: () => void;
}

export function MyOrdersPage({ onBackToMenu, onNavigateHome }: MyOrdersPageProps) {
  const {
    firebaseUser,
    customerOrders,
    customerOrdersLoading,
    loadCustomerOrders,
    logout,
  } = useRestaurant();

  const [trackingOrder, setTrackingOrder] = useState<CustomerOrder | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  useEffect(() => {
    loadCustomerOrders();
  }, [loadCustomerOrders]);

  const getStatusBadge = (order: CustomerOrder) => {
    const status = order.status;
    switch (status) {
      case 'delivered':
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Delivered</span>
          </span>
        );
      case 'out_for_delivery':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-sky-100 text-sky-800 border border-sky-200 animate-pulse">
            <Truck className="w-3 h-3 text-sky-600" />
            <span>Out for Delivery</span>
          </span>
        );
      case 'packed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
            <PackageCheck className="w-3 h-3 text-amber-600" />
            <span>Packed</span>
          </span>
        );
      case 'preparing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Preparing</span>
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
            <CheckCircle2 className="w-3 h-3 text-blue-600" />
            <span>Confirmed</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-stone-100 text-stone-700 border border-stone-200">
            <Clock className="w-3 h-3 text-stone-500" />
            <span>Received</span>
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 pt-24 pb-16 px-4 sm:px-6 lg:px-8 selection:bg-amber-600 selection:text-white">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
                Customer Account
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              My Orders & Live Tracking
            </h1>
            <p className="text-xs sm:text-sm text-stone-400 mt-0.5">
              Track your delicious food orders in real time and view your complete One Bite order history.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={customerOrdersLoading}
              onClick={() => loadCustomerOrders()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition-colors cursor-pointer"
              title="Refresh order history"
            >
              <RotateCw className={`w-3.5 h-3.5 ${customerOrdersLoading ? 'animate-spin text-amber-400' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              onClick={onBackToMenu}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-black shadow-md transition-colors cursor-pointer"
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>Order More</span>
            </button>
          </div>
        </div>

        {/* User Account / Google Sign-in Status Banner */}
        {firebaseUser ? (
          <div className="p-4 rounded-2xl bg-stone-950/80 border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              {firebaseUser.photoURL ? (
                <img
                  src={firebaseUser.photoURL}
                  alt={firebaseUser.displayName || 'Customer'}
                  className="w-10 h-10 rounded-full border border-amber-500/40 object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-amber-600 text-white font-black flex items-center justify-center text-sm">
                  {(firebaseUser.displayName || firebaseUser.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <div>
                <span className="font-extrabold text-white text-sm block">
                  {firebaseUser.displayName || 'Food Lover'}
                </span>
                <span className="text-stone-400">{firebaseUser.email}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={async () => {
                await logout();
              }}
              className="px-3 py-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-stone-900 border border-stone-800 text-xs font-semibold self-start sm:self-auto transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-950/40 border border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="font-extrabold text-amber-300 text-sm block">
                Sign in with Google to Sync Orders
              </span>
              <p className="text-xs text-amber-200/80">
                Keep your order history across all devices and get 1-click status tracking.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOnboardingOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-stone-100 text-stone-900 font-extrabold text-xs shadow-md transition-all self-start sm:self-auto cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-amber-600" />
              <span>Continue with Google</span>
            </button>
          </div>
        )}

        {/* Loading State */}
        {customerOrdersLoading && customerOrders.length === 0 && (
          <div className="py-16 text-center space-y-3">
            <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-stone-400 font-semibold">Loading your order history...</p>
          </div>
        )}

        {/* Empty State */}
        {!customerOrdersLoading && customerOrders.length === 0 && (
          <div className="bg-stone-950/60 border border-stone-800 rounded-3xl p-8 sm:p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
              <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">No Orders Found Yet</h3>
              <p className="text-xs sm:text-sm text-stone-400 max-w-sm mx-auto">
                You haven&apos;t placed any orders yet. Explore our handcrafted burgers, fresh dough pizzas, and crispy chicken treats!
              </p>
            </div>
            <button
              type="button"
              onClick={onBackToMenu}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
            >
              <span>Explore Delicious Menu</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Order Cards List */}
        {customerOrders.length > 0 && (
          <div className="space-y-4">
            {customerOrders.map((ord) => {
              const isExpanded = expandedOrderId === ord.id;
              const dateStr = new Date(ord.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });
              const timeStr = new Date(ord.createdAt).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              });

              return (
                <div
                  key={ord.id}
                  className="bg-stone-950/80 border border-stone-800 rounded-3xl p-5 sm:p-6 shadow-md transition-all hover:border-stone-700/80 space-y-4"
                >
                  {/* Top Line: ID, Date, Status */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-800/80">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono font-black text-amber-400 text-sm bg-stone-900 border border-stone-800 px-3 py-1 rounded-xl">
                        {ord.id}
                      </span>
                      {getStatusBadge(ord)}
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-stone-900 text-stone-400 border border-stone-800">
                        {ord.orderType === 'takeaway' ? 'Takeaway' : ord.orderType === 'dine_in' ? 'Dine-In' : 'Home Delivery'}
                      </span>
                    </div>

                    <span className="text-xs text-stone-400 font-medium">
                      {dateStr} at {timeStr}
                    </span>
                  </div>

                  {/* Summary Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="text-xs text-stone-300 font-medium">
                        {ord.items?.length || 0} items:{' '}
                        <span className="text-stone-400">
                          {ord.items?.map((i) => `${i.quantity}x ${i.name}`).slice(0, 3).join(', ')}
                          {ord.items && ord.items.length > 3 ? '...' : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="font-black text-white text-base">₹{ord.totalAmount}</span>
                        <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded-md">
                          {ord.paymentStatus === 'paid' ? 'Paid' : 'Pay on Delivery'}
                        </span>
                      </div>
                    </div>

                    {/* Actions: Track Order & View Details */}
                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <button
                        type="button"
                        onClick={() => setTrackingOrder(ord)}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Track Order</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setExpandedOrderId(isExpanded ? null : ord.id)}
                        className="p-2.5 rounded-2xl bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-800 transition-colors cursor-pointer"
                        title={isExpanded ? 'Hide items' : 'View full details'}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Collapsible Full Order Details */}
                  {isExpanded && (
                    <div className="pt-4 border-t border-stone-800/80 space-y-3 animate-in fade-in duration-150 text-xs">
                      <div className="bg-stone-900/80 rounded-2xl p-4 border border-stone-800/60 divide-y divide-stone-800">
                        {ord.items?.map((item, iIdx) => (
                          <div key={iIdx} className="py-2.5 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                            <div>
                              <div className="font-bold text-white flex items-center gap-2">
                                <span className="text-amber-400 font-extrabold">{item.quantity}x</span>
                                <span>{item.name}</span>
                                {item.variant && (
                                  <span className="text-[10px] text-stone-400 bg-stone-800 px-1.5 py-0.2 rounded">
                                    {item.variant.name}
                                  </span>
                                )}
                              </div>
                              {item.addons && item.addons.length > 0 && (
                                <div className="text-[11px] text-stone-400 pl-5">
                                  + {item.addons.map((a) => a.name).join(', ')}
                                </div>
                              )}
                            </div>
                            <span className="font-bold text-stone-200">
                              ₹{item.unitPrice * item.quantity}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Delivery Address */}
                      {ord.orderType === 'delivery' && (ord.deliveryAddress || ord.houseFlat) && (
                        <div className="p-3 bg-stone-900/60 rounded-xl border border-stone-800 flex items-start gap-2 text-stone-300 text-xs">
                          <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          <div className="leading-relaxed">
                            <span className="font-bold text-white block">Delivery Address:</span>
                            <span>
                              {ord.deliveryAddress ||
                                [ord.houseFlat, ord.streetArea, ord.landmark, ord.city, ord.pincode]
                                  .filter(Boolean)
                                  .join(', ')}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Live Order Tracking Modal */}
      {trackingOrder && (
        <OrderTrackingModal
          order={trackingOrder}
          isOpen={Boolean(trackingOrder)}
          onClose={() => setTrackingOrder(null)}
          onOrderUpdated={(updated) => {
            setTrackingOrder(updated);
          }}
        />
      )}

      {/* Customer Onboarding Modal */}
      <CustomerOnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        title="Sign In to Sync Orders"
        subtitle="Connect with Google to view and manage all your One Bite orders across any browser or phone."
      />
    </div>
  );
}
