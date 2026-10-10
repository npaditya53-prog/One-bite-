import React from 'react';
import { useRestaurant } from '../../context/RestaurantContext.tsx';
import { Phone, MessageSquare, MapPin, ShoppingBag } from 'lucide-react';

export function QuickActions() {
  const { settings } = useRestaurant();

  const cleanPhone = settings.whatsapp ? settings.whatsapp.replace(/[^0-9]/g, '') : '';
  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent('Hello One Bite Motihari, I would like to inquire about the menu.')}`
    : settings.orderUrl;

  const actions = [
    {
      title: 'Call Us',
      subtitle: settings.phone || 'Direct Line',
      icon: Phone,
      href: settings.phone ? `tel:${settings.phone}` : '',
      bg: 'hover:bg-amber-50 text-amber-800 border-stone-200',
      iconBg: 'bg-amber-100 text-amber-800',
      isExternal: false,
    },
    {
      title: 'WhatsApp',
      subtitle: 'Fast Chat & Menu',
      icon: MessageSquare,
      href: whatsappUrl,
      bg: 'hover:bg-emerald-50 text-emerald-800 border-stone-200',
      iconBg: 'bg-emerald-100 text-emerald-800',
      isExternal: true,
    },
    {
      title: 'Directions',
      subtitle: 'Rajendra Nagar',
      icon: MapPin,
      href: settings.mapsUrl,
      bg: 'hover:bg-sky-50 text-sky-800 border-stone-200',
      iconBg: 'bg-sky-100 text-sky-800',
      isExternal: true,
    },
    {
      title: 'Order Online',
      subtitle: settings.orderingPlatformName || 'Direct Pickup',
      icon: ShoppingBag,
      href: settings.orderUrl || whatsappUrl,
      bg: 'hover:bg-orange-50 text-orange-800 border-stone-200',
      iconBg: 'bg-orange-100 text-orange-800',
      isExternal: true,
    },
  ];

  return (
    <section className="bg-white border-b border-stone-200/80 shadow-xs relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {actions.map(action => {
            if (!action.href) return null;
            const Icon = action.icon;
            return (
              <a
                key={action.title}
                href={action.href}
                target={action.isExternal ? '_blank' : undefined}
                rel={action.isExternal ? 'noopener noreferrer' : undefined}
                className={`flex items-center gap-3 p-3 sm:p-4 rounded-xl border bg-stone-50/50 transition-all duration-200 group active:scale-[0.98] ${action.bg}`}
              >
                <div
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${action.iconBg}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-bold text-stone-900 group-hover:text-stone-950 truncate">
                    {action.title}
                  </div>
                  <div className="text-[11px] sm:text-xs text-stone-500 truncate">
                    {action.subtitle}
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
