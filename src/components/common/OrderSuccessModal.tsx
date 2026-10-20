import React, { useEffect } from 'react';
import { Check, MessageSquare, ArrowRight, X, Sparkles, ShoppingBag, Clock } from 'lucide-react';
import { CustomerOrder } from '../../types/index.ts';

interface OrderSuccessModalProps {
  order: CustomerOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onContinueBrowsing: () => void;
  onTrackOrder?: () => void;
  whatsappUrl?: string;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  order,
  isOpen,
  onClose,
  onContinueBrowsing,
  onTrackOrder,
  whatsappUrl,
}) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen || !order) return null;

  const totalItemsCount = (order.items || []).reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-success-title"
      className="fixed inset-0 z-[100] bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Celebration Confetti Effect Overlay */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {[...Array(24)].map((_, i) => {
          const colors = ['#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#ec4899', '#8b5cf6'];
          const color = colors[i % colors.length];
          const left = `${(i * 4.2 + 2) % 100}%`;
          const delay = `${(i * 0.15) % 2.5}s`;
          const duration = `${2.8 + (i % 4) * 0.5}s`;
          const size = `${6 + (i % 3) * 3}px`;

          return (
            <span
              key={i}
              className="absolute rounded-xs opacity-80 animate-bounce"
              style={{
                left,
                top: '-10px',
                width: size,
                height: size,
                backgroundColor: color,
                animationDelay: delay,
                animationDuration: duration,
                transform: `rotate(${i * 35}deg)`,
                animationIterationCount: 'infinite',
              }}
            />
          );
        })}
      </div>

      {/* Main Celebration Card */}
      <div
        className="relative z-10 w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-amber-100 p-6 sm:p-8 text-center animate-in zoom-in-95 duration-300 my-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Celebration Checkmark with Pulsing Ring Animation */}
        <div className="relative mx-auto w-20 h-20 mb-4 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-35" />
          <div className="relative w-20 h-20 rounded-full bg-linear-to-tr from-emerald-600 to-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30">
            <Check className="w-10 h-10 stroke-[3]" />
          </div>
          <span className="absolute -top-1 -right-1 bg-amber-500 text-white p-1.5 rounded-full shadow-md">
            <Sparkles className="w-4 h-4 fill-white" />
          </span>
        </div>

        {/* Primary Success Heading */}
        <h2
          id="order-success-title"
          className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight mb-2 leading-snug"
        >
          🎉 Congratulations! Your Order Is Placed Successfully!
        </h2>

        {/* Subtitle Confirmation */}
        <p className="text-xs sm:text-sm text-stone-600 mb-5 max-w-sm mx-auto">
          Your order has been recorded in the restaurant system. Our kitchen team will prepare your fresh meal for delivery.
        </p>

        {/* Order Details Capsule */}
        <div className="bg-stone-50 rounded-2xl p-4 sm:p-5 border border-stone-200/90 text-left space-y-2.5 text-xs text-stone-700 mb-6">
          <div className="flex items-center justify-between pb-2.5 border-b border-stone-200">
            <span className="font-bold text-stone-900 text-xs uppercase tracking-wider">
              Order Reference
            </span>
            <span className="font-mono font-extrabold text-amber-800 bg-amber-100/90 px-2.5 py-1 rounded-lg text-xs tracking-wider">
              {order.id}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-stone-500">Customer Name:</span>
            <span className="font-semibold text-stone-900">{order.customerName}</span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-stone-500">Mobile Number:</span>
            <span className="font-semibold text-stone-900">{order.customerPhone}</span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-stone-500">Items Ordered:</span>
            <span className="font-semibold text-stone-900">
              {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-stone-500">Payment:</span>
            <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              Pay on Delivery (Cash or QR)
            </span>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-stone-200 text-sm font-extrabold text-stone-950">
            <span>Payable Amount:</span>
            <span className="text-amber-700 text-base font-black">₹{order.totalAmount}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          {/* Live Order Tracking Button */}
          {onTrackOrder && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onTrackOrder();
              }}
              className="w-full py-3.5 px-6 rounded-2xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-black text-sm sm:text-base shadow-lg shadow-amber-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 transform active:scale-[0.98]"
            >
              <Clock className="w-5 h-5 text-amber-200" />
              <span>🚚 Track Order Live</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {/* Main "Continue Browsing" Button */}
          <button
            type="button"
            onClick={onContinueBrowsing}
            className="w-full py-3 px-5 rounded-2xl bg-stone-900 hover:bg-stone-800 active:bg-stone-950 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Continue Browsing Menu</span>
          </button>

          {/* Secondary Action: Reopen WhatsApp if needed */}
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-emerald-200"
            >
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>View WhatsApp Confirmation</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

