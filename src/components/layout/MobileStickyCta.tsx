import React from 'react';
import { useRestaurant } from '../../context/RestaurantContext.tsx';
import { Phone, MessageSquare, Utensils, ShoppingBag } from 'lucide-react';

interface MobileStickyCtaProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export function MobileStickyCta({ currentView, onNavigate }: MobileStickyCtaProps) {
  const { settings } = useRestaurant();

  // Hide on admin routes
  if (currentView.startsWith('admin')) {
    return null;
  }

  const cleanPhone = settings.whatsapp ? settings.whatsapp.replace(/[^0-9]/g, '') : '';
  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent('Hello One Bite Motihari, I would like to order food.')}`
    : settings.orderUrl;

  const orderUrl = cleanPhone ? whatsappUrl : settings.orderUrl;

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-stone-950/95 backdrop-blur-md border-t border-stone-800 p-2 shadow-2xl safe-area-pb">
      <div className="grid grid-cols-4 gap-1.5">
        {/* Call */}
        {settings.phone ? (
          <a
            href={`tel:${settings.phone}`}
            className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-stone-900 active:bg-stone-800 text-stone-200"
          >
            <Phone className="w-4 h-4 text-amber-400 mb-0.5" />
            <span className="text-[10px] font-semibold">Call</span>
          </a>
        ) : (
          <div className="opacity-40 flex flex-col items-center justify-center py-2">
            <Phone className="w-4 h-4 mb-0.5" />
            <span className="text-[10px]">Call</span>
          </div>
        )}

        {/* WhatsApp */}
        {cleanPhone ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-emerald-950/80 active:bg-emerald-900 text-emerald-300"
          >
            <MessageSquare className="w-4 h-4 text-emerald-400 mb-0.5" />
            <span className="text-[10px] font-semibold">WhatsApp</span>
          </a>
        ) : (
          <div className="opacity-40 flex flex-col items-center justify-center py-2">
            <MessageSquare className="w-4 h-4 mb-0.5" />
            <span className="text-[10px]">Chat</span>
          </div>
        )}

        {/* Menu */}
        <button
          onClick={() => {
            onNavigate('menu');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-colors ${
            currentView === 'menu'
              ? 'bg-amber-600/30 text-amber-300 font-bold'
              : 'bg-stone-900 active:bg-stone-800 text-stone-200'
          }`}
        >
          <Utensils className="w-4 h-4 text-amber-400 mb-0.5" />
          <span className="text-[10px] font-semibold">Menu</span>
        </button>

        {/* Order */}
        {orderUrl ? (
          <a
            href={orderUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-amber-600 active:bg-amber-700 text-white shadow-xs font-bold"
          >
            <ShoppingBag className="w-4 h-4 text-white mb-0.5" />
            <span className="text-[10px]">Order</span>
          </a>
        ) : (
          <button
            onClick={() => onNavigate('menu')}
            className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-amber-600 text-white font-bold"
          >
            <ShoppingBag className="w-4 h-4 mb-0.5" />
            <span className="text-[10px]">Order</span>
          </button>
        )}
      </div>
    </div>
  );
}
