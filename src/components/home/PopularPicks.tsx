import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext.tsx';
import { FoodCard } from '../menu/FoodCard.tsx';
import { FoodDetailsModal } from '../menu/FoodDetailsModal.tsx';
import { MenuItem } from '../../types/index.ts';
import { Flame, ArrowRight } from 'lucide-react';

interface PopularPicksProps {
  onViewAllMenu?: () => void;
}

export function PopularPicks({ onViewAllMenu }: PopularPicksProps) {
  const { popularItems, categories } = useRestaurant();
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  if (popularItems.length === 0) return null;

  const selectedCategory = selectedItem
    ? categories.find(c => c.id === selectedItem.categoryId)
    : undefined;

  return (
    <section className="py-16 sm:py-20 bg-stone-100/60 border-b border-stone-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-700 mb-2">
              <Flame className="w-4 h-4 fill-amber-600 text-amber-600" />
              <span>Customer Favorites</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-stone-900 tracking-tight">
              Popular Picks
            </h2>
            <p className="mt-1 text-sm text-stone-600">
              The most loved burgers, pizzas, and shakes ordered daily in Motihari.
            </p>
          </div>

          {onViewAllMenu && (
            <button
              onClick={onViewAllMenu}
              className="inline-flex items-center gap-2 text-sm font-bold text-amber-700 hover:text-amber-800 transition-colors group self-start sm:self-auto cursor-pointer"
            >
              <span>Explore Full Menu</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          )}
        </div>

        {/* Popular Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {popularItems.slice(0, 8).map(item => (
            <FoodCard key={item.id} item={item} onSelect={setSelectedItem} />
          ))}
        </div>
      </div>

      <FoodDetailsModal
        item={selectedItem}
        category={selectedCategory}
        onClose={() => setSelectedItem(null)}
      />
    </section>
  );
}
