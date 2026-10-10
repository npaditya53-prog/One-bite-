import React from 'react';
import { useRestaurant } from '../../context/RestaurantContext.tsx';
import { CheckCircle2, MapPin, Sparkles } from 'lucide-react';

export function AboutSection() {
  const { settings } = useRestaurant();

  return (
    <section id="about" className="py-16 sm:py-24 bg-white border-b border-stone-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Visual Showcase */}
          <div className="relative order-2 lg:order-1">
            <div className="relative rounded-2xl overflow-hidden shadow-xl aspect-4/3 bg-stone-100">
              <img
                src={settings.aboutImageUrl}
                alt={settings.restaurantName}
                loading="lazy"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Float badge */}
            <div className="absolute -bottom-6 -right-4 sm:bottom-6 sm:right-6 bg-stone-900 text-white p-4 sm:p-5 rounded-2xl shadow-xl max-w-xs border border-stone-800">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Rajendra Nagar, Motihari</span>
              </div>
              <p className="text-xs sm:text-sm text-stone-300 leading-snug">
                Crafted with care, served hot, and made to satisfy every fast-food craving.
              </p>
            </div>
          </div>

          {/* Text Content */}
          <div className="order-1 lg:order-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-amber-700 mb-2">
              <span>About Us</span>
              {settings.aboutEstablishedYear && (
                <>
                  <span className="text-stone-300">·</span>
                  <span>Est. {settings.aboutEstablishedYear}</span>
                </>
              )}
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight mb-6">
              {settings.aboutHeading}
            </h2>

            <p className="text-stone-600 text-sm sm:text-base leading-relaxed mb-8">
              {settings.aboutDescription}
            </p>

            {/* Highlights List */}
            {settings.aboutHighlights && settings.aboutHighlights.length > 0 && (
              <div className="space-y-3 mb-8">
                {settings.aboutHighlights.map((highlight, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-sm text-stone-800">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="font-medium">{highlight}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Address kicker */}
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-stone-900">Visit Our Outlet</div>
                  <div className="text-xs text-stone-600">{settings.address}, Motihari</div>
                </div>
              </div>

              {settings.mapsUrl && (
                <a
                  href={settings.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-amber-700 hover:text-amber-800 whitespace-nowrap"
                >
                  Directions →
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
