import React from 'react';
import { OneBiteLogo } from './OneBiteLogo.tsx';
import { useRestaurant } from '../../context/RestaurantContext.tsx';
import { Utensils, Home, Phone, MessageSquare, ArrowLeft } from 'lucide-react';

interface NotFoundPageProps {
  onNavigate: (view: string) => void;
}

export function NotFoundPage({ onNavigate }: NotFoundPageProps) {
  const { settings } = useRestaurant();

  const cleanPhone = settings.whatsapp ? settings.whatsapp.replace(/[^0-9]/g, '') : '';
  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent('Hello One Bite Motihari, I need help finding something on your website.')}`
    : settings.orderUrl;

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-20 bg-stone-50">
      <div className="max-w-lg w-full text-center">
        {/* Animated Icon / Number */}
        <div className="mb-6 flex justify-center">
          <button
            onClick={() => onNavigate('home')}
            className="cursor-pointer transition-transform hover:scale-105 focus:outline-none"
            title="Return to One Bite Motihari Home"
          >
            <OneBiteLogo size="lg" showLocation />
          </button>
        </div>

        <div className="relative inline-block mb-4">
          <span className="text-8xl sm:text-9xl font-black text-amber-500/20 select-none">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-600/30">
              <Utensils className="w-8 h-8" />
            </div>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight mb-3">
          Page Not Found
        </h1>

        <p className="text-sm sm:text-base text-stone-600 mb-8 max-w-md mx-auto leading-relaxed">
          Looks like this bite is off the menu! The page you are looking for might have been moved, renamed, or doesn't exist.
        </p>

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
          <button
            onClick={() => onNavigate('menu')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-sm shadow-md transition-colors cursor-pointer"
          >
            <Utensils className="w-4 h-4" />
            <span>Explore Menu</span>
          </button>

          <button
            onClick={() => onNavigate('home')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-stone-100 text-stone-800 font-bold text-sm border border-stone-200 shadow-xs transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Back to Home</span>
          </button>
        </div>

        {/* Need Help / Ordering Bar */}
        <div className="pt-6 border-t border-stone-200/80 flex flex-wrap items-center justify-center gap-4 text-xs text-stone-500">
          <span>Looking to order food directly?</span>
          <div className="flex items-center gap-3">
            {settings.phone && (
              <a
                href={`tel:${settings.phone}`}
                className="inline-flex items-center gap-1.5 font-bold text-amber-700 hover:text-amber-800"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Us</span>
              </a>
            )}
            {cleanPhone && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-bold text-emerald-700 hover:text-emerald-800"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
