import React, { useState, useMemo } from 'react';
import { MenuItem, MenuVariant } from '../../types/index.ts';
import { FoodTypeBadge } from '../common/FoodTypeBadge.tsx';
import { Flame, Eye, Plus, Minus, ShoppingBag, Check } from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext.tsx';
import { useToast } from '../common/Toast.tsx';
import { getBestOfferForItem } from '../../utils/offerUtils.ts';
import { getOptimizedImageUrl } from '../../utils/imageUtils.ts';

interface FoodCardProps {
  item: MenuItem;
  onSelect: (item: MenuItem) => void;
}

export function FoodCard({ item, onSelect }: FoodCardProps) {
  const { addToCart, cart, activeOffers } = useRestaurant();
  const { showToast } = useToast();
  const [localQty, setLocalQty] = useState(1);

  const hasVariants = Boolean(item.variants && item.variants.length > 0);

  // Initialize selected variant to the first available variant
  const [selectedVariant, setSelectedVariant] = useState<MenuVariant | undefined>(() => {
    if (item.variants && item.variants.length > 0) {
      return item.variants.find(v => v.available) || item.variants[0];
    }
    return undefined;
  });

  // Dynamic Offer check
  const bestOffer = useMemo(() => {
    return getBestOfferForItem(item, activeOffers);
  }, [item, activeOffers]);

  // Price calculations based on selected variant or base price
  const isMRP = item.price === 'MRP';
  
  const displayPrice = useMemo(() => {
    if (selectedVariant) {
      return selectedVariant.price === 'MRP' ? 'MRP' : selectedVariant.price;
    }
    if (bestOffer) {
      return bestOffer.discountedPrice;
    }
    return item.discountPrice ?? item.price;
  }, [selectedVariant, bestOffer, item]);

  const originalPrice = useMemo(() => {
    if (selectedVariant) return null;
    if (bestOffer) return bestOffer.originalPrice;
    return item.discountPrice ? item.price : null;
  }, [selectedVariant, bestOffer, item]);

  // Check how many of this item + variant are currently in cart
  const inCartQty = useMemo(() => {
    const entry = cart.find(ci => {
      if (ci.menuItemId !== item.id) return false;
      if (selectedVariant) {
        return ci.variant?.id === selectedVariant.id;
      }
      return !ci.variant;
    });
    return entry?.quantity || 0;
  }, [cart, item.id, selectedVariant]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.available) return;

    if (hasVariants && !selectedVariant) {
      showToast('Please select a size first', 'error');
      return;
    }

    addToCart(item, selectedVariant, [], localQty);
    const variantTag = selectedVariant ? ` (${selectedVariant.name})` : '';
    showToast(`Added ${localQty}x ${item.name}${variantTag} to cart!`, 'success');
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

        {/* Genuine Size / Variant Selector (Only when item has variants) */}
        {hasVariants && item.variants && item.variants.length > 0 && (
          <div className="mb-3 pt-2.5 border-t border-stone-100">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                Size:
              </span>
              {selectedVariant && (
                <span className="text-[11px] font-extrabold text-amber-700">
                  {selectedVariant.name}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {item.variants.map(v => {
                const isSelected = selectedVariant?.id === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedVariant(v);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200 hover:text-stone-950'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                    <span>{v.name}</span>
                    <span className={`text-[10px] ${isSelected ? 'text-amber-100' : 'text-stone-500'}`}>
                      {v.price === 'MRP' ? 'MRP' : `₹${v.price}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Price & Action row */}
        <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2 mt-auto">
          <div>
            <div className="flex items-baseline gap-1">
              {isMRP ? (
                <span className="text-base font-extrabold text-stone-950">MRP</span>
              ) : (
                <>
                  <span className="text-lg font-black text-stone-950">
                    {typeof displayPrice === 'number' ? `₹${displayPrice}` : displayPrice}
                  </span>
                  {originalPrice && (
                    <span className="text-xs text-stone-400 line-through font-medium ml-1">
                      ₹{originalPrice}
                    </span>
                  )}
                </>
              )}
            </div>

            {inCartQty > 0 ? (
              <span className="text-[11px] text-emerald-700 font-bold block">
                {inCartQty} in cart
              </span>
            ) : item.servingInfo ? (
              <span className="text-[11px] text-stone-500 block truncate max-w-[130px]">
                {item.servingInfo}
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            {item.available ? (
              <>
                {/* Quantity Controls */}
                <div className="flex items-center bg-stone-100 border border-stone-200/90 rounded-xl p-0.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLocalQty(q => Math.max(1, q - 1));
                    }}
                    className="w-7 h-7 flex items-center justify-center text-stone-700 hover:text-stone-950 hover:bg-white rounded-lg transition-colors cursor-pointer"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center text-xs font-black text-stone-900">
                    {localQty}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLocalQty(q => q + 1);
                    }}
                    className="w-7 h-7 flex items-center justify-center text-stone-700 hover:text-stone-950 hover:bg-white rounded-lg transition-colors cursor-pointer"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Add to Cart Button */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="inline-flex items-center gap-1.5 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-bold transition-all shadow-xs hover:shadow-md cursor-pointer shrink-0"
                  title="Add to order cart"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>ADD TO CART</span>
                </button>
              </>
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
