import React from 'react';
import { useRestaurant } from '../../context/RestaurantContext.tsx';
import { ShoppingBag, ArrowRight } from 'lucide-react';

export function CartFloatingButton() {
  const { cartCount, cartTotal, setIsCartOpen, isCartOpen } = useRestaurant();

  if (cartCount === 0 || isCartOpen) return null;

  return (
    <div className="fixed bottom-16 sm:bottom-6 right-4 sm:right-6 z-40 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <button
        onClick={() => setIsCartOpen(true)}
        className="flex items-center gap-3 bg-stone-900 hover:bg-stone-800 active:scale-95 text-white py-3 px-5 rounded-2xl shadow-2xl border border-stone-700/80 transition-all cursor-pointer group"
      >
        <div className="relative">
          <ShoppingBag className="w-5 h-5 text-amber-400" />
          <span className="absolute -top-2 -right-2 bg-amber-600 text-white font-extrabold text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-stone-900">
            {cartCount}
          </span>
        </div>

        <div className="text-left">
          <div className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
            View Cart
          </div>
          <div className="text-sm font-extrabold text-white">
            ₹{cartTotal}
          </div>
        </div>

        <div className="w-7 h-7 rounded-lg bg-amber-600/30 text-amber-400 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
          <ArrowRight className="w-4 h-4" />
        </div>
      </button>
    </div>
  );
}
