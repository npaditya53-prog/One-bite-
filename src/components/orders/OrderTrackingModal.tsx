import React, { useState, useEffect, useCallback } from 'react';
import { CustomerOrder } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { doc, onSnapshot, db } from '../../services/firebase.ts';
import { useToast } from '../common/Toast.tsx';
import {
  formatTimelineTime,
  formatTimelineDateTime,
  getOrderTimelineTimestamps,
  getStatusRank,
  getStatusDisplayName,
} from '../../utils/orderTimeline.ts';
import {
  X,
  CheckCircle2,
  Clock,
  PackageCheck,
  Truck,
  RotateCw,
  ShoppingBag,
  MapPin,
  Phone,
  MessageCircle,
  AlertTriangle,
  Receipt,
  Utensils,
} from 'lucide-react';

interface OrderTrackingModalProps {
  order: CustomerOrder;
  isOpen: boolean;
  onClose: () => void;
  onOrderUpdated?: (updatedOrder: CustomerOrder) => void;
}

export function OrderTrackingModal({
  order: initialOrder,
  isOpen,
  onClose,
  onOrderUpdated,
}: OrderTrackingModalProps) {
  const { showToast } = useToast();
  const [order, setOrder] = useState<CustomerOrder>(initialOrder);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  useEffect(() => {
    setOrder(initialOrder);
  }, [initialOrder]);

  // Real-time Firestore snapshot listener for this specific order
  useEffect(() => {
    if (!isOpen || !order.id) return;

    let unsub: (() => void) | null = null;
    try {
      const orderRef = doc(db, 'orders', order.id);
      unsub = onSnapshot(
        orderRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data() as CustomerOrder;
            const updated = { ...data, id: snap.id };
            setOrder(updated);
            if (onOrderUpdated) onOrderUpdated(updated);
            setLastRefreshedAt(new Date());
          }
        },
        (err) => {
          console.warn('Firestore order tracking snapshot note:', err?.message);
        }
      );
    } catch (e) {
      console.warn('Could not attach order tracking snapshot:', e);
    }

    return () => {
      if (unsub) unsub();
    };
  }, [isOpen, order.id, onOrderUpdated]);

  // Manual refresh handler
  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const refreshed = await api.getOrderById(order.id, order.customerUid);
      if (refreshed) {
        setOrder(refreshed);
        if (onOrderUpdated) onOrderUpdated(refreshed);
        setLastRefreshedAt(new Date());
        showToast('Order status refreshed', 'info');
      }
    } catch {
      // Handled silently
    } finally {
      setIsRefreshing(false);
    }
  }, [order.id, order.customerUid, onOrderUpdated, showToast]);

  if (!isOpen) return null;

  const isTakeaway = order.orderType === 'takeaway';
  const isDineIn = order.orderType === 'dine_in';
  const isDelivery = order.orderType === 'delivery' || (!isTakeaway && !isDineIn);
  const isCancelled = order.status === 'cancelled';

  const currentStatus = order.status;
  const rank = getStatusRank(currentStatus);
  const stageTimestamps = getOrderTimelineTimestamps(order);

  const stages = [
    {
      id: 'placed',
      step: 1,
      label: 'Order Placed',
      description: 'Your order has been received and confirmed by One Bite kitchen.',
      icon: CheckCircle2,
      timestamp: formatTimelineTime(stageTimestamps.placedAt),
      isCompleted: rank > 1,
      isCurrent: rank === 1,
    },
    {
      id: 'packed',
      step: 2,
      label: 'Order Packed',
      description: 'Your order has been prepared fresh and sealed hygienically in food-grade packaging.',
      icon: PackageCheck,
      timestamp: rank >= 2 ? formatTimelineTime(stageTimestamps.packedAt) : undefined,
      isCompleted: rank > 2,
      isCurrent: rank === 2,
      extraStatusText: currentStatus === 'preparing' ? 'Kitchen is preparing your food...' : undefined,
    },
    {
      id: 'out_for_delivery',
      step: 3,
      label: isTakeaway ? 'Ready for Pickup' : isDineIn ? 'Serving to Table' : 'Out for Delivery',
      description: isTakeaway
        ? 'Your order is ready at the restaurant counter for pickup.'
        : isDineIn
        ? 'Your food is being served hot to your table.'
        : 'Your delivery partner is on the way to your delivery address.',
      icon: isTakeaway ? ShoppingBag : isDineIn ? Utensils : Truck,
      timestamp: rank >= 3 ? formatTimelineTime(stageTimestamps.outForDeliveryAt) : undefined,
      isCompleted: rank > 3,
      isCurrent: rank === 3,
    },
    {
      id: 'delivered',
      step: 4,
      label: isTakeaway ? 'Order Collected' : isDineIn ? 'Served' : 'Delivered',
      description: isTakeaway
        ? 'Order collected successfully. Thank you for dining with One Bite!'
        : isDineIn
        ? 'Enjoy your delicious meal at One Bite Motihari!'
        : 'Your order has been delivered successfully to your doorstep. Enjoy your meal!',
      icon: CheckCircle2,
      timestamp: rank >= 4 ? formatTimelineTime(stageTimestamps.deliveredAt) : undefined,
      isCompleted: rank >= 4,
      isCurrent: rank === 4,
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200 text-stone-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="bg-stone-950 text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-stone-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-amber-400 text-sm sm:text-base">
                {order.id}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-stone-800 text-stone-300">
                {order.orderType === 'takeaway' ? 'Takeaway' : order.orderType === 'dine_in' ? 'Dine-In' : 'Home Delivery'}
              </span>
            </div>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Placed: {formatTimelineDateTime(order.placedAt || order.createdAt) || 'Recent'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isRefreshing}
              onClick={handleManualRefresh}
              className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white transition-colors cursor-pointer border border-stone-800"
              title="Refresh status"
            >
              <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-white transition-colors cursor-pointer border border-stone-800"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Cancelled Banner */}
          {isCancelled ? (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm">Order Cancelled</h4>
                <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">
                  This order was cancelled by the restaurant or customer. For questions or to place a new order, please contact the restaurant directly.
                </p>
              </div>
            </div>
          ) : (
            /* 4-Stage Status Tracking Timeline */
            <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-4 sm:p-5">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-200">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Live Order Status Timeline
                </span>
                <span className="text-[11px] text-stone-400">
                  Updated {lastRefreshedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>

              <div className="space-y-6 relative before:absolute before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-stone-200">
                {stages.map((stage) => {
                  const Icon = stage.icon;
                  const timeFormatted = stage.timestamp;

                  let circleClasses = 'bg-stone-200 text-stone-400 border-stone-300';
                  let textClasses = 'text-stone-400';

                  if (stage.isCompleted) {
                    circleClasses = 'bg-emerald-600 text-white border-emerald-600 shadow-xs';
                    textClasses = 'text-stone-900';
                  } else if (stage.isCurrent) {
                    circleClasses = 'bg-amber-600 text-white border-amber-600 ring-4 ring-amber-100 animate-pulse';
                    textClasses = 'text-amber-950 font-bold';
                  }

                  return (
                    <div key={stage.id} className="relative flex items-start gap-3.5 pl-0.5">
                      {/* Status Icon Marker */}
                      <div
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 z-10 transition-all ${circleClasses}`}
                      >
                        <Icon className="w-4 h-4 stroke-[2.5]" />
                      </div>

                      {/* Status Details */}
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className={`text-xs sm:text-sm font-extrabold ${textClasses}`}>
                            {stage.label}
                          </h4>
                          {timeFormatted && (
                            <span className="text-[11px] font-mono font-semibold text-stone-500 bg-white border border-stone-200 px-2 py-0.5 rounded-md">
                              {timeFormatted}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">
                          {stage.description}
                        </p>

                        {stage.extraStatusText && (
                          <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 text-[11px] font-bold">
                            <Clock className="w-3.5 h-3.5 text-amber-700 animate-spin" />
                            <span>{stage.extraStatusText}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Delivery & Destination Address */}
          {isDelivery && (
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-stone-900">
                <MapPin className="w-4 h-4 text-amber-600" />
                <span>Delivery Address</span>
              </div>
              <p className="text-stone-700 pl-6 leading-relaxed">
                {order.deliveryAddress ||
                  [order.houseFlat, order.streetArea, order.landmark, order.city, order.pincode]
                    .filter(Boolean)
                    .join(', ')}
              </p>
              {order.deliveryInstructions && (
                <div className="pl-6 pt-1 text-[11px] text-amber-900 font-medium">
                  <span className="font-bold">Instructions: </span>
                  {order.deliveryInstructions}
                </div>
              )}
            </div>
          )}

          {/* Order Items & Summary */}
          <div className="border border-stone-200/80 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2 font-extrabold text-xs uppercase tracking-wider text-stone-700 border-b border-stone-100 pb-2">
              <Receipt className="w-4 h-4 text-amber-600" />
              <span>Order Items ({order.items?.length || 0})</span>
            </div>

            <div className="divide-y divide-stone-100 text-xs">
              {order.items?.map((item, idx) => (
                <div key={idx} className="py-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-black text-amber-700">{item.quantity}x</span>
                    <span className="font-semibold text-stone-800 truncate">{item.name}</span>
                    {item.variant && (
                      <span className="text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.2 rounded">
                        {item.variant.name}
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-stone-900 shrink-0">
                    ₹{item.unitPrice * item.quantity}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-stone-200 space-y-1 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal:</span>
                <span>₹{order.subtotal}</span>
              </div>
              {order.discountAmount ? (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Discount:</span>
                  <span>-₹{order.discountAmount}</span>
                </div>
              ) : null}
              {order.deliveryCharge ? (
                <div className="flex justify-between text-stone-600">
                  <span>Delivery Charge:</span>
                  <span>₹{order.deliveryCharge}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-sm font-black text-stone-900 pt-1.5 border-t border-stone-200">
                <span>Total Amount:</span>
                <span className="text-amber-700">₹{order.totalAmount}</span>
              </div>
              <div className="text-[11px] font-semibold text-stone-500 pt-0.5">
                Payment: <span className="text-amber-800 font-bold uppercase">{order.paymentStatus === 'paid' ? 'Paid' : 'Pay on Delivery (Cash or QR)'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-stone-50 border-t border-stone-200 px-5 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <a
              href="tel:+918210442538"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-stone-100 text-stone-800 text-xs font-bold border border-stone-200 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-amber-600" />
              <span>Call Restaurant</span>
            </a>
            <a
              href={`https://wa.me/918210442538?text=${encodeURIComponent(`Hello One Bite Motihari, regarding my order ${order.id}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>WhatsApp</span>
            </a>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Close Tracker
          </button>
        </div>
      </div>
    </div>
  );
}
