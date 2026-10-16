import React from 'react';
import { MenuItem } from '../../types/index.ts';
import { FoodTypeBadge } from '../common/FoodTypeBadge.tsx';
import { Flame, Eye, Plus, ShoppingBag, SlidersHorizontal } from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext.tsx';
import { useToast } from '../common/Toast.tsx';
import { getBestOfferForItem } from '../../utils/offerUtils.ts';
import { getOptimizedImageUrl } from '../../utils/imageUtils.ts';

interface FoodCardProps {
  item: MenuItem;
  onSelect: (item: MenuItem) => void;
}

export function FoodCard({ item, onSelect }: FoodCardProps) {
  const { addToCart, setIsCartOpen, activeOffers } = useRestaurant();
  const { showToast } = useToast();

  const hasVariants = Boolean(item.variants && item.variants.length > 0);

  // Dynamic Offer check
  const bestOffer = React.useMemo(() => {
    return getBestOfferForItem(item, activeOffers);
  }, [item, activeOffers]);

  // Price calculations
  let minVariantPrice = 0;
  if (hasVariants && item.variants) {
    const numericPrices = item.variants
      .map(v => (typeof v.price === 'number' ? v.price : 999))
      .filter(p => p !== 999);
    minVariantPrice = numericPrices.length > 0 ? Math.min(...numericPrices) : 0;
  }

  const isMRP = item.price === 'MRP';
  const effectiveCurrentPrice = bestOffer
    ? bestOffer.discountedPrice
    : (item.discountPrice ?? item.price);
  const effectiveOriginalPrice = bestOffer
    ? bestOffer.originalPrice
    : (item.discountPrice ? item.price : null);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.available) return;

    if (hasVariants) {
      onSelect(item);
      return;
    }

    addToCart(item, undefined, [], 1);
    showToast(`Added ${item.name} to cart!`, 'success');
  };

  return (
    <div className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-stone-200/90 shadow-xs hover:shadow-md hover:border-amber-500/40 transition-all duration-300">
      {/* Image Container */}
      <div
        className="relative aspect-4/3 w-full bg-stone-100 overflow-hidden cursor-pointer"
        onClick={() => onSelect(item)}
      >
        <img
          src={getOptimizedImageUrl(item.imageUrl, 550, 75)}
          alt={item.name}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Gradient shadow for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 via-transparent to-transparent pointer-events-none" />

        {/* Status Indicators */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10 flex-wrap">
          <span className="p-1.5 bg-white/95 backdrop-blur-xs rounded-md shadow-xs">
            <FoodTypeBadge type={item.foodType} />
          </span>

          {item.popular && (
            <span className="bg-amber-600 text-white text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
              <Flame className="w-3 h-3 fill-white" /> Popular
            </span>
          )}

          {bestOffer && (
            <span
              className="bg-emerald-600 text-white text-[11px] font-extrabold tracking-wide uppercase px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs"
              title={`Special Offer: ${bestOffer.offerTitle}`}
            >
              {bestOffer.discountBadge}
            </span>
          )}
        </div>

        {/* Unavailable overlay */}
        {!item.available && (
          <div className="absolute inset-0 bg-stone-900/80 backdrop-blur-2xs flex items-center justify-center p-3 text-center z-20">
            <span className="text-white text-xs font-semibold uppercase tracking-wider bg-rose-900/90 px-3 py-1.5 rounded-lg border border-rose-700/50 shadow-sm">
              Currently Unavailable
            </span>
          </div>
        )}

        {/* Quick View Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(item);
          }}
          className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white text-stone-900 px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 shadow-md z-10"
          title="View details & options"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Details</span>
        </button>
      </div>

      {/* Card Content */}
      <div className="flex-1 flex flex-col p-4 sm:p-5">
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3
              onClick={() => onSelect(item)}
              className="text-base font-bold text-stone-900 group-hover:text-amber-800 transition-colors cursor-pointer line-clamp-1"
              title={item.name}
            >
              {item.name}
            </h3>
          </div>

          <p className="text-xs sm:text-sm text-stone-600 line-clamp-2 leading-relaxed mb-3">
            {item.description}
          </p>
        </div>

        {/* Price & Action row */}
        <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2 mt-auto">
          <div>
            <div className="flex items-baseline gap-1">
              {hasVariants ? (
                <>
                  <span className="text-xs text-stone-500 font-medium">From</span>
                  <span className="text-lg font-extrabold text-stone-950">₹{minVariantPrice}</span>
                </>
              ) : isMRP ? (
                <span className="text-base font-extrabold text-stone-950">MRP</span>
              ) : (
                <>
                  <span className="text-lg font-extrabold text-stone-950">₹{effectiveCurrentPrice}</span>
                  {effectiveOriginalPrice && (
                    <span className="text-xs text-stone-400 line-through font-medium ml-1">
                      ₹{effectiveOriginalPrice}
                    </span>
                  )}
                </>
              )}
            </div>

            {hasVariants ? (
              <span className="text-[11px] text-amber-700 font-semibold block">
                {item.variants?.length} sizes available
              </span>
            ) : item.servingInfo ? (
              <span className="text-[11px] text-stone-500 block truncate max-w-[130px]">
                {item.servingInfo}
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-1.5">
            {item.available ? (
              hasVariants ? (
                <button
                  type="button"
                  onClick={() => onSelect(item)}
                  className="inline-flex items-center gap-1.5 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-bold transition-all shadow-xs hover:shadow-md cursor-pointer"
                  title="Choose your preferred size or variation"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Choose Size</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleQuickAdd}
                  className="inline-flex items-center gap-1.5 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-bold transition-all shadow-xs hover:shadow-md cursor-pointer"
                  title="Add to order cart"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add to Cart</span>
                </button>
              )
            ) : (
              <span className="text-xs font-medium text-stone-400 py-1.5 px-2 bg-stone-100 rounded-lg">
                Unavailable
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
