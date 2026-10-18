import React from 'react';
import { useRestaurant } from '../../context/RestaurantContext.tsx';
import { ArrowRight, MapPin, Phone, MessageSquare, Clock, Sparkles, CheckCircle2 } from 'lucide-react';
import { getOptimizedImageUrl } from '../../utils/imageUtils.ts';

interface HeroProps {
  onNavigateToMenu?: () => void;
  onNavigateToCheckout?: () => void;
}

export function Hero({ onNavigateToMenu }: HeroProps) {
  const { settings, openStatus } = useRestaurant();

  const handleMenuClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onNavigateToMenu) {
      onNavigateToMenu();
    } else {
      const el = document.getElementById('menu');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const cleanPhone = settings.whatsapp ? settings.whatsapp.replace(/[^0-9]/g, '') : '';
  const orderUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent('Hello One Bite Motihari, I would like to place an order.')}`
    : settings.orderUrl;

  return (
    <section className="relative overflow-hidden bg-stone-950 text-white min-h-[580px] lg:min-h-[660px] flex items-center pt-24 pb-16 sm:py-24">
      {/* Background Hero Image with atmospheric gradient overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={getOptimizedImageUrl(settings.heroImageUrl, 1200, 75)}
          alt="One Bite Motihari Food"
          fetchPriority="high"
          decoding="async"
          className="w-full h-full object-cover object-center opacity-30 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/90 to-stone-950/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-stone-950/50" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Branch Title & CTA */}
          <div className="lg:col-span-7 max-w-2xl">
            {/* Status Indicator & Location kicker */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-stone-900/90 border border-stone-800 text-xs mb-6 shadow-xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  openStatus.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <span className="font-semibold text-stone-200">{openStatus.statusText}</span>
              <span className="text-stone-600">·</span>
              <span className="text-stone-400 flex items-center gap-1 font-medium">
                <MapPin className="w-3 h-3 text-amber-500" /> Motihari Branch
              </span>
            </div>

            {/* Restaurant Branch Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white mb-3 leading-[1.08]">
              One Bite <span className="text-amber-500 font-extrabold text-3xl sm:text-4xl lg:text-5xl block sm:inline">Motihari Branch</span>
            </h1>

            {/* Tagline */}
            <p className="text-lg sm:text-xl font-medium text-amber-400 mb-5">
              {settings.tagline}
            </p>

            {/* Clean Concrete Description */}
            <p className="text-sm sm:text-base text-stone-300 mb-8 leading-relaxed max-w-xl">
              Freshly grilled burgers, authentic cheese pizzas, crispy chicken buckets, potato tornados, and rich milkshakes prepared hot to order at our {settings.address} kitchen.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={handleMenuClick}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-sm sm:text-base shadow-xs transition-colors cursor-pointer"
              >
                <span>Explore Full Menu</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {orderUrl && (
                <a
                  href={orderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/80 font-semibold text-sm transition-colors"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>WhatsApp Chat</span>
                </a>
              )}

              {settings.mapsUrl && (
                <a
                  href={settings.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-800 font-medium text-sm transition-colors"
                >
                  <MapPin className="w-4 h-4 text-amber-400" />
                  <span>Get Directions</span>
                </a>
              )}
            </div>

            {/* Quick Highlights Row */}
            <div className="mt-10 pt-6 border-t border-stone-800/80 flex flex-wrap items-center gap-y-3 gap-x-6 text-xs text-stone-400">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Daily 11:00 AM to 10:00 PM</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                <span>{settings.address}, Motihari</span>
              </div>
              {settings.phone && (
                <a
                  href={`tel:${settings.phone}`}
                  className="flex items-center gap-1.5 text-stone-300 hover:text-white transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-amber-500" />
                  <span>{settings.phone}</span>
                </a>
              )}
            </div>
          </div>

          {/* Right Column: Real Food Photography Feature */}
          <div className="lg:col-span-5 hidden lg:block">
            <div className="relative">
              {/* Main Food Card */}
              <div className="rounded-2xl overflow-hidden border border-stone-800 bg-stone-900 aspect-4/3 relative group shadow-sm">
                <img
                  src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80"
                  alt="One Bite Special Burger"
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/20 to-transparent pointer-events-none" />

                {/* Badge 1: Anchored cleanly in top right corner */}
                <div className="absolute top-3.5 right-3.5 bg-stone-950/85 backdrop-blur-xs border border-stone-800/80 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-sm pointer-events-none">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-white">100% Fresh</div>
                    <div className="text-[10px] text-stone-400">Grilled on Order</div>
                  </div>
                </div>

                <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block mb-1">
                      Chef's Special
                    </span>
                    <h3 className="text-xl font-bold text-white">One Bite Special Burger</h3>
                    <p className="text-xs text-stone-300">Crispy patty, melted cheddar & secret herb mayo</p>
                  </div>
                  <div className="bg-amber-600 text-white font-extrabold text-sm px-3.5 py-1.5 rounded-xl shadow-xs">
                    ₹119
                  </div>
                </div>
              </div>

              {/* Anchored Brand Highlights Strip */}
              <div className="mt-3 bg-stone-900/90 border border-stone-800 p-3 rounded-xl flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">400+ Outlets Pan-India</div>
                    <div className="text-[10px] text-stone-400">Now Serving Motihari</div>
                  </div>
                </div>
                <div className="text-[11px] font-medium text-amber-400/90 hidden sm:block">
                  Signature Recipe
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
