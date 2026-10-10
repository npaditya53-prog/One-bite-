import React from 'react';
import { useRestaurant } from '../../context/RestaurantContext.tsx';
import { Utensils, FolderTree, Image, Star, Tag, Clock, ArrowRight, Plus, ExternalLink, CheckCircle2 } from 'lucide-react';

interface AdminDashboardHomeProps {
  onNavigateTab: (tab: string) => void;
  onViewLiveSite: () => void;
}

export function AdminDashboardHome({ onNavigateTab, onViewLiveSite }: AdminDashboardHomeProps) {
  const { menuItems, categories, gallery, reviews, offers, settings, openStatus } = useRestaurant();

  const activeItemsCount = menuItems.filter(i => i.available).length;
  const unavailableCount = menuItems.length - activeItemsCount;
  const popularCount = menuItems.filter(i => i.popular).length;

  const stats = [
    {
      label: 'Total Menu Items',
      value: menuItems.length,
      sub: `${activeItemsCount} active · ${unavailableCount} unavailable`,
      icon: Utensils,
      color: 'bg-amber-100 text-amber-800',
      tab: 'menu',
    },
    {
      label: 'Menu Categories',
      value: categories.length,
      sub: `${categories.filter(c => c.active).length} active categories`,
      icon: FolderTree,
      color: 'bg-blue-100 text-blue-800',
      tab: 'categories',
    },
    {
      label: 'Gallery Photos',
      value: gallery.length,
      sub: `${gallery.filter(g => g.featured).length} featured photos`,
      icon: Image,
      color: 'bg-purple-100 text-purple-800',
      tab: 'gallery',
    },
    {
      label: 'Customer Reviews',
      value: reviews.length,
      sub: `${reviews.filter(r => r.featured).length} featured on homepage`,
      icon: Star,
      color: 'bg-emerald-100 text-emerald-800',
      tab: 'reviews',
    },
    {
      label: 'Active Offers',
      value: offers.filter(o => o.active).length,
      sub: `${offers.length} total deals created`,
      icon: Tag,
      color: 'bg-rose-100 text-rose-800',
      tab: 'offers',
    },
    {
      label: 'Store Status',
      value: openStatus.isOpen ? 'Open Now' : 'Closed',
      sub: openStatus.todayScheduleText,
      icon: Clock,
      color: openStatus.isOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-800',
      tab: 'hours',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700 mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Store System Live & Connected</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            {settings.restaurantName} CMS
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-stone-600 max-w-xl">
            Manage your live menu items, prices, opening hours, customer reviews, photo gallery, and ordering settings. Changes save directly to the database.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onNavigateTab('menu')}
            className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Menu Item</span>
          </button>

          <button
            onClick={onViewLiveSite}
            className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            <span>Preview Website</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              onClick={() => onNavigateTab(s.tab)}
              className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${s.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-stone-400 group-hover:text-amber-600 transition-colors">
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>

              <div>
                <div className="text-2xl font-black text-stone-900 mb-1">{s.value}</div>
                <div className="text-xs font-bold text-stone-700">{s.label}</div>
                <div className="text-[11px] text-stone-600 mt-0.5">{s.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Action Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Picks Overview */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-stone-900">Featured Popular Items ({popularCount})</h2>
            <button
              onClick={() => onNavigateTab('menu')}
              className="text-xs font-bold text-amber-700 hover:text-amber-800"
            >
              Manage Menu →
            </button>
          </div>

          <div className="divide-y divide-stone-100">
            {menuItems
              .filter(i => i.popular)
              .slice(0, 5)
              .map(item => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-10 h-10 rounded-lg object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-stone-900 truncate">{item.name}</div>
                      <div className="text-xs text-stone-600">₹{item.price}</div>
                    </div>
                  </div>

                  <span
                    className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                      item.available
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {item.available ? 'Available' : 'Unavailable'}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Store Settings Overview */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-stone-900">Configured Outlets & Contacts</h2>
              <button
                onClick={() => onNavigateTab('settings')}
                className="text-xs font-bold text-amber-700 hover:text-amber-800"
              >
                Edit Settings →
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-stone-600">
              <div className="flex items-start justify-between py-1.5 border-b border-stone-100">
                <span className="text-stone-600">Address:</span>
                <span className="font-medium text-stone-800 text-right max-w-xs">{settings.address}, Motihari</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-stone-100">
                <span className="text-stone-600">Phone Hotline:</span>
                <span className="font-medium text-stone-800">{settings.phone || 'Not configured'}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-stone-100">
                <span className="text-stone-600">WhatsApp Ordering:</span>
                <span className="font-medium text-stone-800">{settings.whatsapp || 'Not configured'}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-stone-100">
                <span className="text-stone-600">Ordering Mode:</span>
                <span className="font-medium text-stone-800">{settings.orderingPlatformName}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between">
            <span className="text-xs text-stone-600">Last updated: {new Date(settings.updatedAt).toLocaleDateString()}</span>
            <button
              onClick={() => onNavigateTab('hours')}
              className="text-xs font-semibold text-stone-700 hover:text-stone-900"
            >
              Adjust Daily Hours →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
