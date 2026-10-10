import React from 'react';
import { useRestaurant } from '../../context/RestaurantContext.tsx';
import { Flame, ShieldCheck, Sparkles, Coffee, HeartHandshake, Award } from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  Flame,
  ShieldCheck,
  Sparkles,
  Coffee,
  HeartHandshake,
  Award,
};

export function WhyChooseUs() {
  const { settings } = useRestaurant();
  const features = settings.whyChooseUs || [];

  if (features.length === 0) return null;

  return (
    <section className="py-16 sm:py-20 bg-stone-50 border-b border-stone-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs uppercase tracking-widest text-amber-700 font-bold mb-2">
            The One Bite Promise
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-stone-900 tracking-tight">
            Why Food Lovers Choose Us
          </h2>
          <p className="mt-2 text-sm text-stone-600">
            Dedicated to serving fresh, delicious, and consistent quality every single time.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(feat => {
            const Icon = iconMap[feat.icon] || Sparkles;
            return (
              <div
                key={feat.id}
                className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs hover:shadow-md transition-all group flex flex-col"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-stone-900 mb-2">{feat.title}</h3>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  {feat.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
