import React, { useState, useMemo } from 'react';
import { useRestaurant } from '../../context/RestaurantContext.tsx';
import { FoodCard } from './FoodCard.tsx';
import { FoodDetailsModal } from './FoodDetailsModal.tsx';
import { MenuItem } from '../../types/index.ts';
import { Search, UtensilsCrossed, Sparkles, ShoppingBag, ArrowRight } from 'lucide-react';

interface MenuSectionProps {
  id?: string;
  isStandalonePage?: boolean;
  onNavigateToCheckout?: () => void;
}

type DietaryFilter = 'all' | 'veg' | 'non_veg';
type PriceFilter = 'all' | 'under_100' | '100_200' | 'above_200';

export function MenuSection({
  id = 'menu',
  isStandalonePage = false,
  onNavigateToCheckout,
}: MenuSectionProps) {
  const { categories, menuItems, cart, cartTotal, setIsCartOpen } = useRestaurant();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dietaryFilter, setDietaryFilter] = useState<DietaryFilter>('all');
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('all');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  // Active categories sorted by displayOrder
  const activeCategories = useMemo(() => {
    return categories
      .filter(c => c.active)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [categories]);

  // Filtered menu items
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return menuItems.filter(item => {
      // Category filter
      if (selectedCategory !== 'all' && item.categoryId !== selectedCategory) {
        return false;
      }

      // Dietary filter
      if (dietaryFilter === 'veg' && item.foodType !== 'veg') {
        return false;
      }
      if (dietaryFilter === 'non_veg' && item.foodType !== 'non_veg') {
        return false;
      }

      // Price filter
      const effectivePrice =
        typeof item.price === 'number'
          ? item.discountPrice ?? item.price
          : item.variants && item.variants.length > 0 && typeof item.variants[0].price === 'number'
          ? item.variants[0].price
          : 0;

      if (priceFilter === 'under_100' && effectivePrice >= 100) {
        return false;
      }
      if (priceFilter === '100_200' && (effectivePrice < 100 || effectivePrice > 200)) {
        return false;
      }
      if (priceFilter === 'above_200' && effectivePrice <= 200) {
        return false;
      }

      // Search match
      if (q) {
        const itemCat = categories.find(c => c.id === item.categoryId)?.name.toLowerCase() || '';
        const nameMatch = item.name.toLowerCase().includes(q);
        const descMatch = item.description.toLowerCase().includes(q);
        const catMatch = itemCat.includes(q);
        const ingredientMatch = item.ingredients?.toLowerCase().includes(q);
        if (!nameMatch && !descMatch && !catMatch && !ingredientMatch) {
          return false;
        }
      }

      return true;
    });
  }, [menuItems, selectedCategory, searchQuery, dietaryFilter, priceFilter, categories]);

  const selectedItemCategory = useMemo(() => {
    if (!selectedItem) return undefined;
    return categories.find(c => c.id === selectedItem.categoryId);
  }, [selectedItem, categories]);

  return (
    <section id={id} className={`py-14 md:py-20 bg-stone-50 ${isStandalonePage ? 'pt-28' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
          <p className="text-xs uppercase tracking-widest text-amber-700 font-extrabold mb-2">
            Fresh & Handcrafted • One Bite Motihari
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-stone-900 tracking-tight">
            Explore Our Authentic Menu
          </h2>
          <p className="mt-3 text-stone-600 text-sm sm:text-base">
            Every dish is prepared fresh on order with signature seasonings, pure dairy mozzarella, and authentic franchise quality.
          </p>
        </div>

        {/* Live Order Now Banner when Cart has Items */}
        {cart.length > 0 && (
          <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-2xl p-4 mb-6 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white text-stone-950 flex items-center justify-center font-black text-sm shadow-xs shrink-0">
                {cart.length}
              </div>
              <div>
                <p className="text-sm font-black">
                  {cart.length} {cart.length === 1 ? 'item' : 'items'} in your cart • Total: ₹{cartTotal}
                </p>
                <p className="text-xs text-amber-100">
                  Pay on Delivery (Cash or QR) • Home delivery available in Motihari
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-stone-950/40 hover:bg-stone-950/60 text-white text-xs font-bold transition-all cursor-pointer"
              >
                View Cart
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onNavigateToCheckout) {
                    onNavigateToCheckout();
                  } else {
                    setIsCartOpen(true);
                  }
                }}
                className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-white text-amber-700 hover:bg-amber-50 active:bg-amber-100 text-xs font-extrabold shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>ORDER NOW</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/90 shadow-sm mb-8 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                placeholder="Search burgers, pizzas, chicken buckets, waffles..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 text-stone-900 placeholder:text-stone-400 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Dietary Classification Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex p-1 bg-stone-100 rounded-xl border border-stone-200/80">
                <button
                  type="button"
                  onClick={() => setDietaryFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    dietaryFilter === 'all'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  All Food
                </button>
                <button
                  type="button"
                  onClick={() => setDietaryFilter('veg')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    dietaryFilter === 'veg'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-stone-600 hover:text-emerald-700'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Veg Only</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDietaryFilter('non_veg')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    dietaryFilter === 'non_veg'
                      ? 'bg-rose-700 text-white shadow-xs'
                      : 'text-stone-600 hover:text-rose-700'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  <span>Non-Veg</span>
                </button>
              </div>

              {/* Price Band Filters */}
              <div className="hidden sm:inline-flex p-1 bg-stone-100 rounded-xl border border-stone-200/80">
                <button
                  type="button"
                  onClick={() => setPriceFilter('all')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    priceFilter === 'all' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  Any Price
                </button>
                <button
                  type="button"
                  onClick={() => setPriceFilter('under_100')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    priceFilter === 'under_100' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  &lt; ₹100
                </button>
                <button
                  type="button"
                  onClick={() => setPriceFilter('100_200')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    priceFilter === '100_200' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  ₹100–200
                </button>
                <button
                  type="button"
                  onClick={() => setPriceFilter('above_200')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    priceFilter === 'above_200' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  ₹200+
                </button>
              </div>

              <span className="text-xs text-stone-500 font-semibold px-2">
                {filteredItems.length} items
              </span>
            </div>
          </div>

          {/* Horizontally scrollable Category Navigation Tabs */}
          <div className="pt-3 border-t border-stone-100 flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none scroll-smooth">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`shrink-0 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-stone-950 text-white shadow-sm ring-1 ring-stone-950'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200 hover:text-stone-950'
              }`}
            >
              All Items ({menuItems.length})
            </button>

            {activeCategories.map(cat => {
              const count = menuItems.filter(i => i.categoryId === cat.id).length;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`shrink-0 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-amber-600 text-white shadow-sm ring-1 ring-amber-600'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200 hover:text-stone-950'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span
                    className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Menu Grid */}
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map(item => (
              <FoodCard key={item.id} item={item} onSelect={setSelectedItem} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center max-w-md mx-auto shadow-xs">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <UtensilsCrossed className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-stone-900 mb-2">No matching dishes</h3>
            <p className="text-xs sm:text-sm text-stone-500 mb-6 leading-relaxed">
              We couldn't find any items matching your selected criteria. Try adjusting the category, dietary preference, or search terms.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
                setDietaryFilter('all');
                setPriceFilter('all');
              }}
              className="px-5 py-2.5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition-colors cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        )}

        {/* Food Details & Variant Options Modal */}
        <FoodDetailsModal
          item={selectedItem}
          category={selectedItemCategory}
          onClose={() => setSelectedItem(null)}
        />
      </div>
    </section>
  );
}
