import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext.tsx';
import { OneBiteLogo } from '../common/OneBiteLogo.tsx';
import { AdminDashboardHome } from './AdminDashboardHome.tsx';
import { AdminMenu } from './AdminMenu.tsx';
import { AdminCategories } from './AdminCategories.tsx';
import { AdminGallery } from './AdminGallery.tsx';
import { AdminReviews } from './AdminReviews.tsx';
import { AdminOffers } from './AdminOffers.tsx';
import { AdminHours } from './AdminHours.tsx';
import { AdminSettings } from './AdminSettings.tsx';
import {
  LayoutDashboard,
  Utensils,
  FolderTree,
  Image,
  Star,
  Tag,
  Clock,
  Settings,
  LogOut,
  ExternalLink,
  Menu as MenuIcon,
  X,
  ShieldCheck,
} from 'lucide-react';

interface AdminLayoutProps {
  onViewLiveSite: () => void;
}

export function AdminLayout({ onViewLiveSite }: AdminLayoutProps) {
  const { logout, adminUser, settings } = useRestaurant();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'menu', label: 'Menu Items', icon: Utensils },
    { id: 'categories', label: 'Categories', icon: FolderTree },
    { id: 'gallery', label: 'Gallery Photos', icon: Image },
    { id: 'reviews', label: 'Customer Reviews', icon: Star },
    { id: 'offers', label: 'Special Offers', icon: Tag },
    { id: 'hours', label: 'Business Hours', icon: Clock },
    { id: 'settings', label: 'Website Settings', icon: Settings },
  ];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setMobileSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col md:flex-row text-stone-900">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex w-64 bg-stone-950 text-white flex-col border-r border-stone-800 shrink-0">
        {/* Brand header */}
        <div className="p-4 border-b border-stone-800 flex items-center justify-between">
          <OneBiteLogo size="sm" showLocation onClick={onViewLiveSite} />
        </div>

        {/* Navigation links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-stone-400 hover:text-stone-100 hover:bg-stone-900'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer Admin info & Logout */}
        <div className="p-4 border-t border-stone-800 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs text-stone-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="truncate">{adminUser?.email || 'admin@onebitemotihari.in'}</span>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={onViewLiveSite}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Live Site</span>
            </button>

            <button
              onClick={() => logout()}
              className="p-2 rounded-lg bg-stone-900 hover:bg-rose-950/80 text-stone-400 hover:text-rose-300 transition-colors cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white border-b border-stone-200 sticky top-0 z-30 px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg text-stone-600 hover:bg-stone-100"
            >
              <MenuIcon className="w-5 h-5" />
            </button>

            <span className="text-xs font-bold uppercase tracking-wider text-stone-600">
              {navItems.find(i => i.id === activeTab)?.label}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onViewLiveSite}
              className="hidden sm:inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition-colors cursor-pointer"
            >
              <span>View Website</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => logout()}
              className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Dynamic Tab Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <AdminDashboardHome
              onNavigateTab={handleTabChange}
              onViewLiveSite={onViewLiveSite}
            />
          )}
          {activeTab === 'menu' && <AdminMenu />}
          {activeTab === 'categories' && <AdminCategories />}
          {activeTab === 'gallery' && <AdminGallery />}
          {activeTab === 'reviews' && <AdminReviews />}
          {activeTab === 'offers' && <AdminOffers />}
          {activeTab === 'hours' && <AdminHours />}
          {activeTab === 'settings' && <AdminSettings />}
        </main>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileSidebarOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="md:hidden fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex animate-in fade-in"
          onClick={() => setMobileSidebarOpen(false)}
        >
          <div
            className="w-72 bg-stone-950 text-white h-full flex flex-col p-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-800 mb-4">
              <OneBiteLogo size="sm" showLocation onClick={onViewLiveSite} />
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1.5 text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="space-y-1 flex-1 overflow-y-auto">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold ${
                      isActive ? 'bg-amber-600 text-white' : 'text-stone-400 hover:bg-stone-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-stone-800 space-y-2">
              <button
                onClick={onViewLiveSite}
                className="w-full py-2 bg-stone-900 text-stone-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Preview Website</span>
              </button>
              <button
                onClick={() => logout()}
                className="w-full py-2 bg-rose-950/70 text-rose-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
