import React, { useState, useEffect } from 'react';
import { MenuItem, MenuVariant, CartItemAddon } from '../../types/index.ts';
import { FoodTypeBadge } from '../common/FoodTypeBadge.tsx';
import { useRestaurant } from '../../context/RestaurantContext.tsx';
import { useToast } from '../common/Toast.tsx';
import { X, Plus, Minus, ShoppingBag, Check } from 'lucide-react';

interface VariantModalProps {
  item: MenuItem | null;
  onClose: () => void;
}

export function VariantModal({ item, onClose }: VariantModalProps) {
  const { addToCart, setIsCartOpen } = useRestaurant();
  const { showToast } = useToast();

  const [selectedVariant, setSelectedVariant] = useState<MenuVariant | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<CartItemAddon[]>([]);
  const [quantity, setQuantity] = useState(1);

  // Available add-ons from the menu
  const availableAddons: CartItemAddon[] = [
    { id: 'addon_extra_cheese', name: 'Extra Cheese', price: 35 },
    { id: 'addon_cheese_dip', name: 'Cheese Dip', price: 40 },
  ];

  useEffect(() => {
    if (item && item.variants && item.variants.length > 0) {
      setSelectedVariant(item.variants[0]);
    } else {
      setSelectedVariant(null);
    }
    setSelectedAddons([]);
    setQuantity(1);
  }, [item]);

  if (!item) return null;

  const currentPrice = selectedVariant
    ? (selectedVariant.price === 'MRP' ? 20 : Number(selectedVariant.price))
    : (item.price === 'MRP' ? 20 : (item.discountPrice ?? Number(item.price)));

  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const totalPrice = (currentPrice + addonsTotal) * quantity;

  const toggleAddon = (addon: CartItemAddon) => {
    if (selectedAddons.some(a => a.id === addon.id)) {
      setSelectedAddons(prev => prev.filter(a => a.id !== addon.id));
    } else {
      setSelectedAddons(prev => [...prev, addon]);
    }
  };

  const handleAddToCart = () => {
    if (item.variants && item.variants.length > 0 && !selectedVariant) {
      showToast('Please select a size/variant option', 'error');
      return;
    }

    addToCart(item, selectedVariant || undefined, selectedAddons, quantity);
    showToast(`Added ${quantity}x ${item.name} to cart!`, 'success');
    onClose();
    setIsCartOpen(true);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-stone-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Image */}
        <div className="relative aspect-16/9 w-full bg-stone-100 overflow-hidden shrink-0">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-transparent pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-stone-950/70 hover:bg-stone-950 text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Badge & Name over image */}
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1 bg-white/95 rounded-md shadow-xs">
                <FoodTypeBadge type={item.foodType} />
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                {item.foodType === 'veg' ? 'Pure Veg' : 'Non-Veg'}
              </span>
            </div>
            <h3 className="text-xl font-extrabold text-white leading-tight">{item.name}</h3>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {item.description && (
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              {item.description}
            </p>
          )}

          {/* Variant / Size Options */}
          {item.variants && item.variants.length > 0 && (
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-stone-900 mb-3 flex items-center justify-between">
                <span>Select Size / Portion</span>
                <span className="text-[11px] font-normal text-stone-500">Required</span>
              </div>

              <div className="space-y-2">
                {item.variants.map(variant => {
                  const isSelected = selectedVariant?.id === variant.id;
                  const priceLabel = variant.price === 'MRP' ? 'MRP' : `₹${variant.price}`;
                  return (
                    <label
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-amber-600 bg-amber-50/50 shadow-xs ring-1 ring-amber-600/20'
                          : 'border-stone-200 hover:border-stone-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'border-amber-600 bg-amber-600 text-white'
                              : 'border-stone-300 bg-white'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <span className="text-sm font-bold text-stone-900">{variant.name}</span>
                      </div>

                      <span className="text-sm font-extrabold text-stone-900">{priceLabel}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add-ons */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-stone-900 mb-3 flex items-center justify-between">
              <span>Delicious Add-ons</span>
              <span className="text-[11px] font-normal text-stone-500">Optional</span>
            </div>

            <div className="space-y-2">
              {availableAddons.map(addon => {
                const isChecked = selectedAddons.some(a => a.id === addon.id);
                return (
                  <label
                    key={addon.id}
                    onClick={() => toggleAddon(addon)}
                    className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                      isChecked
                        ? 'border-amber-600 bg-amber-50/40 shadow-xs'
                        : 'border-stone-200 hover:border-stone-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                          isChecked
                            ? 'border-amber-600 bg-amber-600 text-white'
                            : 'border-stone-300 bg-white'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-stone-800">
                        {addon.name}
                      </span>
                    </div>

                    <span className="text-xs sm:text-sm font-bold text-amber-800">
                      +₹{addon.price}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-stone-200 bg-stone-50 flex items-center justify-between gap-4 shrink-0">
          {/* Quantity Controls */}
          <div className="flex items-center gap-3 bg-white border border-stone-200 rounded-xl px-2 py-1 shadow-2xs">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="p-1 rounded-lg text-stone-600 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Decrease quantity"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="font-extrabold text-sm text-stone-900 w-5 text-center">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="p-1 rounded-lg text-stone-600 hover:bg-stone-100"
              aria-label="Increase quantity"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add to Cart button */}
          <button
            onClick={handleAddToCart}
            className="flex-1 py-3 px-5 rounded-xl bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-between cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              <span>Add to Cart</span>
            </span>
            <span>₹{totalPrice}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
