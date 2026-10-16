import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext.tsx';
import { Tag, Copy, Check, ArrowRight, Sparkles, Calendar, Utensils, CheckCircle } from 'lucide-react';
import { useToast } from '../common/Toast.tsx';
import { getOfferTargetLabel, isOfferPubliclyActive } from '../../utils/offerUtils.ts';
import { OfferItem } from '../../types/index.ts';
import { getOptimizedImageUrl } from '../../utils/imageUtils.ts';

export function OffersSection() {
  const { activeOffers, applyOffer, setIsCartOpen } = useRestaurant();
  const { showToast } = useToast();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Filter only published, currently valid offers
  const validOffers = activeOffers.filter(o => isOfferPubliclyActive(o));

  if (validOffers.length === 0) return null;

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast(`Coupon code ${code} copied to clipboard!`, 'success');
    setTimeout(() => setCopiedCode(null), 3000);
  };

  const handleClaimOffer = (offer: OfferItem) => {
    const res = applyOffer(offer);
    if (res.success) {
      showToast(res.message, 'success');
      setIsCartOpen(true);
    } else {
      // If cart empty or not eligible yet, navigate to menu to pick eligible items
      showToast(`Offer "${offer.title}" selected! Choose your favorite dishes from the menu below.`, 'info');
      const menuEl = document.getElementById('menu');
      if (menuEl) {
        menuEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleViewMenu = () => {
    const menuEl = document.getElementById('menu');
    if (menuEl) {
      menuEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="offers" className="py-14 bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent border-y border-amber-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-100/80 text-amber-900 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Exclusive Promotions</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Special Deals & Combos
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 max-w-lg mt-1">
            Exclusive festive discounts and combo savings made fresh at One Bite Motihari.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {validOffers.map(offer => {
            const targetBadge = getOfferTargetLabel(offer);
            const endDateText = offer.endDate
              ? `Valid till ${new Date(offer.endDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}`
              : 'Limited Period Offer';

            return (
              <div
                key={offer.id}
                className="bg-white rounded-3xl border border-amber-200/90 shadow-xs flex flex-col justify-between hover:shadow-xl hover:border-amber-400 transition-all duration-300 relative overflow-hidden group"
              >
                {/* Poster Image if provided */}
                {offer.imageUrl && (
                  <div className="h-44 w-full bg-stone-100 overflow-hidden relative">
                    <img
                      src={getOptimizedImageUrl(offer.imageUrl, 700, 75)}
                      alt={offer.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white text-xs">
                      <span className="bg-amber-600/90 backdrop-blur-xs font-extrabold px-2.5 py-1 rounded-lg">
                        {offer.discount}
                      </span>
                      <span className="text-[11px] font-semibold text-stone-200 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {endDateText}
                      </span>
                    </div>
                  </div>
                )}

                {/* Card Content */}
                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                  <div>
                    {!offer.imageUrl && (
                      <div className="flex items-center justify-between mb-3">
                        <span className="bg-amber-600 text-white font-extrabold text-xs px-3 py-1 rounded-xl shadow-xs">
                          {offer.discount}
                        </span>
                        <span className="text-xs font-medium text-stone-500 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-amber-600" />
                          {endDateText}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[11px] font-bold text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                        <Utensils className="w-3 h-3 text-amber-600" />
                        <span>{targetBadge}</span>
                      </span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-extrabold text-stone-900 mb-1 leading-snug">
                      {offer.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed mb-4">
                      {offer.description}
                    </p>

                    {offer.terms && (
                      <p className="text-[11px] text-stone-400 italic mb-4">
                        * {offer.terms}
                      </p>
                    )}
                  </div>

                  {/* Actions & Code Row */}
                  <div className="pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3 mt-auto">
                    {offer.code ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleCopy(offer.code!)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-900 text-xs font-mono font-bold transition-colors cursor-pointer border border-stone-200"
                          title="Click to copy promo code"
                        >
                          <Tag className="w-3.5 h-3.5 text-amber-600" />
                          <span>{offer.code}</span>
                          {copiedCode === offer.code ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-stone-400" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-stone-400 font-medium">Auto-applied in cart</span>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleViewMenu}
                        className="text-xs font-bold text-stone-600 hover:text-stone-900 py-2 px-3 rounded-xl transition-colors cursor-pointer"
                      >
                        View Menu
                      </button>

                      <button
                        onClick={() => handleClaimOffer(offer)}
                        className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
                      >
                        <span>Claim Offer</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
