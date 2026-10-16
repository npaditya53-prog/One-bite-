import React, { useEffect, useState, useMemo } from 'react';
import { X, Phone, MessageSquare, Flame, Check, Plus, Minus, ShoppingBag, Sparkles } from 'lucide-react';
import { MenuItem, Category, MenuVariant, CartItemAddon } from '../../types/index.ts';
import { FoodTypeBadge } from '../common/FoodTypeBadge.tsx';
import { useRestaurant } from '../../context/RestaurantContext.tsx';
import { useToast } from '../common/Toast.tsx';
import { getBestOfferForItem } from '../../utils/offerUtils.ts';

interface FoodDetailsModalProps {
  item: MenuItem | null;
  category?: Category;
  onClose: () => void;
}

const OFFICIAL_ADDONS: CartItemAddon[] = [
  { id: 'addon_extra_cheese', name: 'Extra Cheese', price: 35 },
  { id: 'addon_cheese_dip', name: 'Cheese Dip', price: 40 },
];

export function FoodDetailsModal({ item, category, onClose }: FoodDetailsModalProps) {
  const { settings, addToCart, setIsCartOpen, activeOffers } = useRestaurant();
  const { showToast } = useToast();

  const [selectedVariant, setSelectedVariant] = useState<MenuVariant | undefined>(undefined);
  const [selectedAddons, setSelectedAddons] = useState<CartItemAddon[]>([]);
  const [quantity, setQuantity] = useState<number>(1);

  // Initialize or reset selections when item changes
  useEffect(() => {
    if (item) {
      if (item.variants && item.variants.length > 0) {
        setSelectedVariant(item.variants[0]);
      } else {
        setSelectedVariant(undefined);
      }
      setSelectedAddons([]);
      setQuantity(1);
    }
  }, [item]);

  // Keyboard escape handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (item) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [item, onClose]);

  if (!item) return null;

  const hasVariants = Boolean(item.variants && item.variants.length > 0);
  const isMRP = item.price === 'MRP';

  const bestOffer = useMemo(() => {
    return item ? getBestOfferForItem(item, activeOffers) : null;
  }, [item, activeOffers]);

  // Base unit price
  let unitPrice = 0;
  if (selectedVariant) {
    unitPrice = selectedVariant.price === 'MRP' ? 20 : Number(selectedVariant.price);
  } else if (isMRP) {
    unitPrice = 20; // Default nominal MRP
  } else if (bestOffer) {
    unitPrice = bestOffer.discountedPrice;
  } else {
    unitPrice = item.discountPrice ?? Number(item.price);
  }

  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const totalPrice = (unitPrice + addonsTotal) * quantity;

  const toggleAddon = (addon: CartItemAddon) => {
    setSelectedAddons(prev => {
      const exists = prev.some(a => a.id === addon.id);
      if (exists) {
        return prev.filter(a => a.id !== addon.id);
      } else {
        return [...prev, addon];
      }
    });
  };

  const handleAddToCart = () => {
    if (!item.available) return;

    addToCart(item, selectedVariant, selectedAddons, quantity);
    const variantLabel = selectedVariant ? ` (${selectedVariant.name})` : '';
    showToast(`Added ${quantity}x ${item.name}${variantLabel} to cart!`, 'success');
    onClose();
    setIsCartOpen(true);
  };

  // WhatsApp order URL
  const variantTxt = selectedVariant ? ` [${selectedVariant.name}]` : '';
  const addonsTxt = selectedAddons.length > 0 ? ` + Addons: ${selectedAddons.map(a => a.name).join(', ')}` : '';
  const encodedMsg = encodeURIComponent(
    `Hello One Bite Motihari, I would like to order:\n• ${quantity}x ${item.name}${variantTxt}${addonsTxt}\nTotal: ₹${totalPrice}\nArya Samaj Chowk, Motihari branch.`
  );
  const cleanPhone = settings.whatsapp ? settings.whatsapp.replace(/[^0-9]/g, '') : '';
  const whatsappUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodedMsg}` : settings.orderUrl;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-food-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/75 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-stone-200 max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-white/90 text-stone-700 hover:text-stone-950 hover:bg-white shadow-md transition-all active:scale-95 cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Container */}
        <div className="overflow-y-auto">
          {/* Food Image Banner */}
          <div className="relative h-60 sm:h-72 w-full bg-stone-100 shrink-0">
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <div className="flex items-center gap-2 bg-stone-900/85 backdrop-blur-xs text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm">
                <FoodTypeBadge type={item.foodType} showText />
                {item.popular && (
                  <>
                    <span className="text-stone-400">·</span>
                    <span className="text-amber-300 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 fill-amber-300" /> Best Seller
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                {bestOffer && (
                  <span className="bg-emerald-600 text-white text-xs px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider shadow-xs">
                    {bestOffer.discountBadge}
                  </span>
                )}
                {!item.available && (
                  <span className="bg-rose-900/95 text-rose-100 text-xs px-3 py-1 rounded-lg font-bold uppercase tracking-wider">
                    Currently Unavailable
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Details Content */}
          <div className="p-5 sm:p-6 space-y-5">
            {/* Title & Category Row */}
            <div className="flex items-start justify-between gap-4">
              <div>
                {category && (
                  <p className="text-xs uppercase tracking-wider text-amber-700 font-bold mb-1">
                    {category.name}
                  </p>
                )}
                <h3 id="modal-food-title" className="text-2xl font-extrabold text-stone-900 leading-tight">
                  {item.name}
                </h3>
              </div>

              <div className="text-right shrink-0">
                {hasVariants ? (
                  <div>
                    <span className="text-xs text-stone-500 font-medium block">Starting from</span>
                    <span className="text-2xl font-black text-amber-700">₹{unitPrice}</span>
                  </div>
                ) : isMRP ? (
                  <div className="text-2xl font-black text-amber-700">MRP</div>
                ) : (
                  <div>
                    <div className="text-2xl font-black text-amber-700">₹{unitPrice}</div>
                    {(bestOffer || item.discountPrice) && (
                      <div className="text-xs text-stone-400 line-through">
                        ₹{bestOffer ? bestOffer.originalPrice : item.price}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <p className="text-stone-600 text-sm leading-relaxed">
              {item.description}
            </p>

            {/* VARIANT / SIZE SELECTION */}
            {hasVariants && item.variants && (
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/90 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs uppercase tracking-wider font-bold text-stone-800">
                    Select Size / Option <span className="text-amber-600">*</span>
                  </h4>
                  <span className="text-[11px] text-stone-500 font-medium">Required</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {item.variants.map(v => {
                    const isSelected = selectedVariant?.id === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariant(v)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                          isSelected
                            ? 'bg-amber-600 border-amber-600 text-white shadow-md ring-2 ring-amber-600/20'
                            : 'bg-white border-stone-200 text-stone-800 hover:border-amber-400 hover:bg-amber-50/50'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className={`text-xs font-bold leading-tight ${isSelected ? 'text-white' : 'text-stone-900'}`}>
                            {v.name}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                        </div>
                        <span className={`text-sm font-extrabold ${isSelected ? 'text-amber-100' : 'text-amber-700'}`}>
                          {v.price === 'MRP' ? 'MRP' : `₹${v.price}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ADD-ONS SECTION */}
            <div className="bg-amber-50/40 p-4 rounded-2xl border border-amber-200/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <h4 className="text-xs uppercase tracking-wider font-bold text-stone-800">
                    Enhance Your Order (Add-ons)
                  </h4>
                </div>
                <span className="text-[11px] text-stone-500 font-medium">Optional</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {OFFICIAL_ADDONS.map(addon => {
                  const isChecked = selectedAddons.some(a => a.id === addon.id);
                  return (
                    <label
                      key={addon.id}
                      onClick={() => toggleAddon(addon)}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-white border-amber-500 shadow-xs ring-1 ring-amber-500 text-stone-900'
                          : 'bg-white/80 border-stone-200/90 text-stone-700 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                            isChecked
                              ? 'bg-amber-600 border-amber-600 text-white'
                              : 'border-stone-300 bg-white'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-3" />}
                        </div>
                        <span className="text-xs font-bold">{addon.name}</span>
                      </div>
                      <span className="text-xs font-extrabold text-amber-700">+₹{addon.price}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Portion & Ingredients */}
            {(item.servingInfo || item.ingredients) && (
              <div className="space-y-2.5 text-xs text-stone-600 bg-stone-50 p-3.5 rounded-xl border border-stone-200/60">
                {item.servingInfo && (
                  <div>
                    <strong className="text-stone-800 uppercase tracking-wider text-[10px] block mb-0.5">
                      Serving Info
                    </strong>
                    <span>{item.servingInfo}</span>
                  </div>
                )}
                {item.ingredients && (
                  <div>
                    <strong className="text-stone-800 uppercase tracking-wider text-[10px] block mb-0.5">
                      Ingredients & Prep
                    </strong>
                    <span>{item.ingredients}</span>
                  </div>
                )}
              </div>
            )}

            {/* Quantity Selector */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
                Quantity
              </span>

              <div className="flex items-center gap-3 bg-stone-100 p-1 rounded-xl border border-stone-200">
                <button
                  type="button"
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="w-8 h-8 rounded-lg bg-white text-stone-700 hover:text-stone-950 flex items-center justify-center font-bold shadow-2xs disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-8 text-center text-sm font-extrabold text-stone-900">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(q => q + 1)}
                  className="w-8 h-8 rounded-lg bg-white text-stone-700 hover:text-stone-950 flex items-center justify-center font-bold shadow-2xs cursor-pointer"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Actions: Add to Cart & WhatsApp */}
            <div className="space-y-2.5 pt-3 border-t border-stone-100">
              {item.available ? (
                <>
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add to Cart • {isMRP && !selectedVariant ? 'MRP' : `₹${totalPrice}`}</span>
                  </button>

                  <div className="flex items-center gap-2 pt-1">
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Order on WhatsApp</span>
                    </a>

                    {settings.phone && (
                      <a
                        href={`tel:${settings.phone}`}
                        className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call</span>
                      </a>
                    )}
                  </div>
                </>
              ) : (
                <div className="w-full py-3.5 px-4 bg-stone-100 text-stone-500 rounded-xl text-center text-xs font-semibold">
                  This item is currently sold out. Please explore our other delicious options!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
