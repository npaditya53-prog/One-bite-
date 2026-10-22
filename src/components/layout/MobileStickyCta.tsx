import React from 'react';
import { useRestaurant } from '../../context/RestaurantContext.tsx';
import { Phone, MessageSquare, Utensils, Clock, ShoppingBag } from 'lucide-react';

interface MobileStickyCtaProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export function MobileStickyCta({ currentView, onNavigate }: MobileStickyCtaProps) {
  const { settings, cart, setIsCartOpen, customerOrders } = useRestaurant();

  // Hide on admin and delivery portal routes
  if (currentView.startsWith('admin') || currentView.startsWith('delivery')) {
    return null;
  }

  const cleanPhone = settings.whatsapp ? settings.whatsapp.replace(/[^0-9]/g, '') : '';
  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent('Hello One Bite Motihari, I would like to order food.')}`
    : settings.orderUrl;

  const activeOrdersCount = customerOrders.filter(
    (o) => o.status !== 'delivered' && o.status !== 'completed' && o.status !== 'cancelled'
  ).length;

  return (
    <>
      {/* Floating Cart Bar if items exist in cart */}
      {cart.length > 0 && (
        <div className="sm:hidden fixed bottom-16 left-3 right-3 z-40 pointer-events-auto animate-in slide-in-from-bottom-2 duration-200">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="w-full py-2.5 px-4 rounded-2xl bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white shadow-xl flex items-center justify-between font-extrabold text-xs cursor-pointer border border-amber-400/40"
          >
            <div className="flex items-center gap-2">
              <div className="relative">
                <ShoppingBag className="w-4 h-4" />
                <span className="absolute -top-1.5 -right-2 bg-white text-stone-950 font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>
              <span>View Cart & Checkout</span>
            </div>
            <span className="text-amber-100 font-mono text-xs">
              ₹{cart.reduce((sum, item) => {
                const addonsPrice = (item.addons || []).reduce((aSum, a) => aSum + a.price, 0);
                return sum + (item.unitPrice + addonsPrice) * item.quantity;
              }, 0)} →
            </span>
          </button>
        </div>
      )}

      {/* Main 4-Column Bottom Sticky Navigation */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-stone-950/95 backdrop-blur-md border-t border-stone-800/90 px-2 py-1.5 shadow-2xl safe-area-pb pointer-events-auto">
        <div className="grid grid-cols-4 gap-1 pointer-events-auto">
          {/* 1. Call */}
          {settings.phone ? (
            <a
              href={`tel:${settings.phone.replace(/[^0-9+]/g, '')}`}
              className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl bg-stone-900 active:bg-stone-800 text-stone-200 pointer-events-auto touch-manipulation"
              title="Call One Bite Motihari"
            >
              <Phone className="w-4 h-4 text-amber-400 mb-0.5" />
              <span className="text-[10px] font-semibold">Call</span>
            </a>
          ) : (
            <div className="opacity-40 flex flex-col items-center justify-center py-1.5 pointer-events-none text-stone-500">
              <Phone className="w-4 h-4 mb-0.5" />
              <span className="text-[10px]">Call</span>
            </div>
          )}

          {/* 2. WhatsApp */}
          {cleanPhone ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl bg-emerald-950/80 active:bg-emerald-900 text-emerald-300 pointer-events-auto touch-manipulation border border-emerald-800/40"
              title="Chat on WhatsApp"
            >
              <MessageSquare className="w-4 h-4 text-emerald-400 mb-0.5" />
              <span className="text-[10px] font-semibold">WhatsApp</span>
            </a>
          ) : (
            <div className="opacity-40 flex flex-col items-center justify-center py-1.5 pointer-events-none text-stone-500">
              <MessageSquare className="w-4 h-4 mb-0.5" />
              <span className="text-[10px]">WhatsApp</span>
            </div>
          )}

          {/* 3. Menu */}
          <button
            type="button"
            onClick={() => {
              onNavigate('menu');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-colors cursor-pointer pointer-events-auto touch-manipulation ${
              currentView === 'menu'
                ? 'bg-amber-600/30 text-amber-300 font-bold border border-amber-500/40'
                : 'bg-stone-900 active:bg-stone-800 text-stone-200'
            }`}
            title="Browse Menu"
          >
            <Utensils className="w-4 h-4 text-amber-400 mb-0.5" />
            <span className="text-[10px] font-semibold">Menu</span>
          </button>

          {/* 4. Track Order */}
          <button
            type="button"
            onClick={() => {
              onNavigate('my-orders');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-colors relative cursor-pointer pointer-events-auto touch-manipulation ${
              currentView === 'my-orders'
                ? 'bg-amber-600/30 text-amber-300 font-bold border border-amber-500/40'
                : 'bg-stone-900 active:bg-stone-800 text-stone-200'
            }`}
            title="Track Live Order & View History"
          >
            <div className="relative">
              <Clock className="w-4 h-4 text-amber-400 mb-0.5" />
              {activeOrdersCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-emerald-500 text-stone-950 font-black text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center animate-pulse">
                  {activeOrdersCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-semibold">Track Order</span>
          </button>
        </div>
      </div>
    </>
  );
}

