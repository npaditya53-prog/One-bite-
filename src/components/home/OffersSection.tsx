import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext.tsx';
import { Tag, Copy, Check, ArrowRight, Sparkles } from 'lucide-react';
import { useToast } from '../common/Toast.tsx';

export function OffersSection() {
  const { activeOffers, settings } = useRestaurant();
  const { showToast } = useToast();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (activeOffers.length === 0) return null;

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast(`Coupon code ${code} copied to clipboard!`, 'success');
    setTimeout(() => setCopiedCode(null), 3000);
  };

  const cleanPhone = settings.whatsapp ? settings.whatsapp.replace(/[^0-9]/g, '') : '';

  return (
    <section className="py-12 bg-amber-500/10 border-y border-amber-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 mb-6 justify-center text-center">
          <Sparkles className="w-5 h-5 text-amber-600" />
          <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 tracking-tight">
            Special Deals & Combos
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {activeOffers.map(offer => {
            const orderWithOfferUrl = cleanPhone
              ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                  `Hello One Bite Motihari, I would like to redeem offer "${offer.title}" ${
                    offer.code ? `(Code: ${offer.code})` : ''
                  }.`
                )}`
              : settings.orderUrl;

            return (
              <div
                key={offer.id}
                className="bg-white rounded-2xl p-5 border border-amber-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 bg-amber-600 text-white font-extrabold text-xs px-3 py-1 rounded-bl-xl shadow-xs">
                  {offer.discount}
                </div>

                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wider mb-2">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Limited Time Offer</span>
                  </div>

                  <h3 className="text-lg font-bold text-stone-900 mb-1">{offer.title}</h3>
                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed mb-4">
                    {offer.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-stone-100 flex items-center justify-between gap-3 mt-auto">
                  {offer.code ? (
                    <button
                      onClick={() => handleCopy(offer.code!)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-mono font-semibold transition-colors"
                      title="Click to copy code"
                    >
                      <span>{offer.code}</span>
                      {copiedCode === offer.code ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-stone-500" />
                      )}
                    </button>
                  ) : (
                    <span className="text-xs text-stone-400 font-medium">Valid in store</span>
                  )}

                  <a
                    href={orderWithOfferUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-800 transition-colors"
                  >
                    <span>Claim Deal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
