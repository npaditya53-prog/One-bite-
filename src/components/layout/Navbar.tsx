import React, { useState, useEffect } from 'react';
import { useRestaurant } from '../../context/RestaurantContext.tsx';
import { OneBiteLogo } from '../common/OneBiteLogo.tsx';
import {
  Menu,
  X,
  Phone,
  ShoppingBag,
  Shield,
  Truck,
  Home,
  UtensilsCrossed,
  Tag,
  MessageCircle,
  ArrowRight,
  Info,
  Image,
  Star,
  MapPin,
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export function Navbar({ currentView, onNavigate }: NavbarProps) {
  const { settings, openStatus, isAdmin, cart, setIsCartOpen } = useRestaurant();
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when drawer is open on mobile
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLinkClick = (view: string) => {
    setMenuOpen(false);
    onNavigate(view);
  };

  const handleSpecialOffers = () => {
    setMenuOpen(false);
    if (currentView === 'home') {
      const el = document.getElementById('offers');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    onNavigate('home');
    setTimeout(() => {
      const el = document.getElementById('offers');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 150);
  };

  const handleContactWhatsApp = () => {
    setMenuOpen(false);
    onNavigate('contact');
  };

  const cleanPhone = settings.whatsapp ? settings.whatsapp.replace(/[^0-9]/g, '') : '';
  const orderUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent('Hello One Bite Motihari, I would like to place an order.')}`
    : settings.orderUrl;

  const secondaryLinks = [
    { label: 'About Us', view: 'about', icon: Info },
    { label: 'Gallery', view: 'gallery', icon: Image },
    { label: 'Reviews', view: 'reviews', icon: Star },
    { label: 'Location & Hours', view: 'location', icon: MapPin },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-stone-950/95 backdrop-blur-md shadow-md py-3 border-b border-stone-800'
          : 'bg-stone-950/80 backdrop-blur-xs py-4 border-b border-stone-800/60'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          {/* Brand Logo & Tagline */}
          <button
            onClick={() => handleLinkClick('home')}
            className="flex items-center text-left group cursor-pointer focus:outline-none py-1"
            title="One Bite Motihari"
          >
            <OneBiteLogo size="md" showLocation />
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6">
            <button
              onClick={() => handleLinkClick('home')}
              className={`text-sm font-semibold transition-colors cursor-pointer py-1 ${
                currentView === 'home'
                  ? 'text-amber-400 border-b-2 border-amber-400'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => handleLinkClick('menu')}
              className={`text-sm font-semibold transition-colors cursor-pointer py-1 ${
                currentView === 'menu'
                  ? 'text-amber-400 border-b-2 border-amber-400'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              Explore Menu
            </button>
            <button
              onClick={handleSpecialOffers}
              className="text-sm font-semibold text-stone-300 hover:text-white transition-colors cursor-pointer py-1"
            >
              Special Offers
            </button>
            <button
              onClick={handleContactWhatsApp}
              className={`text-sm font-semibold transition-colors cursor-pointer py-1 ${
                currentView === 'contact'
                  ? 'text-amber-400 border-b-2 border-amber-400'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              Contact / WhatsApp
            </button>

            {isAdmin && (
              <button
                onClick={() => handleLinkClick('admin')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-950/60 text-amber-300 border border-amber-800/80 hover:bg-amber-900/60 transition-colors"
                title="Admin Panel"
              >
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>Admin CMS</span>
              </button>
            )}
          </nav>

          {/* Right Action Bar (Desktop) */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Status dot */}
            <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-stone-900 border border-stone-800 text-stone-300">
              <span
                className={`w-2 h-2 rounded-full ${
                  openStatus.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-stone-500'
                }`}
              />
              <span>{openStatus.isOpen ? 'Open Now' : 'Closed'}</span>
            </div>

            {settings.phone && (
              <a
                href={`tel:${settings.phone.replace(/[^0-9+]/g, '')}`}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-stone-200 hover:text-white hover:bg-stone-900 text-xs font-semibold transition-colors"
                title="Call Restaurant Directly"
              >
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>{settings.phone}</span>
              </a>
            )}

            {/* Cart Button */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-200 text-xs sm:text-sm font-bold border border-stone-800 transition-all cursor-pointer"
              title="Open Cart & Review Items"
            >
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              <span>Cart</span>
              {cart.length > 0 && (
                <span className="ml-1 bg-amber-600 text-white font-black text-[10px] px-1.5 py-0.2 rounded-full">
                  {cart.length}
                </span>
              )}
            </button>

            {/* ADMIN LOGIN Button */}
            <button
              type="button"
              onClick={() => onNavigate('admin')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white text-xs sm:text-sm font-black shadow-md transition-all cursor-pointer"
              title="Admin Portal Login"
            >
              <Shield className="w-4 h-4" />
              <span>ADMIN LOGIN</span>
            </button>

            {/* Desktop Hamburger Button (☰) */}
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className={`p-2 rounded-xl border transition-colors cursor-pointer flex items-center justify-center ${
                menuOpen
                  ? 'bg-amber-600 text-white border-amber-500'
                  : 'bg-stone-900 hover:bg-stone-800 text-stone-200 hover:text-white border-stone-800'
              }`}
              aria-label={menuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
              title="Main Menu"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Mobile & Tablet Right Controls (< 1024px) */}
          <div className="flex lg:hidden items-center gap-1.5">
            <button
              type="button"
              onClick={() => onNavigate('admin')}
              className="px-2.5 py-1.5 rounded-lg bg-amber-600 active:bg-amber-700 text-white text-xs font-extrabold flex items-center gap-1 shadow-xs cursor-pointer"
              aria-label="Admin Login"
              title="Admin Login"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>ADMIN LOGIN</span>
            </button>

            {settings.phone && (
              <a
                href={`tel:${settings.phone.replace(/[^0-9+]/g, '')}`}
                className="p-2 rounded-lg bg-stone-900 text-amber-400 border border-stone-800"
                aria-label="Call restaurant"
                title="Call One Bite Motihari"
              >
                <Phone className="w-4 h-4" />
              </a>
            )}

            {/* Mobile Hamburger Button (☰) */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                menuOpen
                  ? 'bg-amber-600 text-white border-amber-500'
                  : 'bg-stone-900 text-stone-200 hover:text-white border-stone-800'
              }`}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              title="Open Navigation Menu"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Hamburger Navigation Drawer / Dropdown (Mobile & Desktop) */}
      {menuOpen && (
        <div className="fixed inset-0 top-[65px] z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Menu Panel */}
          <div className="relative w-full sm:w-96 max-w-full bg-stone-950 border-l border-stone-800 h-[calc(100vh-65px)] overflow-y-auto px-5 py-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200">
            <div>
              {/* Header inside drawer */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-800/80">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Navigation Menu
                </span>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-900 transition-colors cursor-pointer"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Core 6 Hamburger Menu Options as Requested */}
              <div className="space-y-1.5">
                {/* 1. Home */}
                <button
                  type="button"
                  onClick={() => handleLinkClick('home')}
                  className={`w-full text-left py-3 px-3.5 rounded-2xl text-sm font-semibold transition-all flex items-center justify-between cursor-pointer ${
                    currentView === 'home'
                      ? 'bg-amber-600/20 text-amber-400 font-bold border border-amber-600/30'
                      : 'text-stone-200 hover:bg-stone-900 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-stone-900 flex items-center justify-center text-amber-400 border border-stone-800">
                      <Home className="w-4 h-4" />
                    </span>
                    <span>Home</span>
                  </span>
                  <ArrowRight className="w-4 h-4 opacity-40" />
                </button>

                {/* 2. Explore Menu */}
                <button
                  type="button"
                  onClick={() => handleLinkClick('menu')}
                  className={`w-full text-left py-3 px-3.5 rounded-2xl text-sm font-semibold transition-all flex items-center justify-between cursor-pointer ${
                    currentView === 'menu'
                      ? 'bg-amber-600/20 text-amber-400 font-bold border border-amber-600/30'
                      : 'text-stone-200 hover:bg-stone-900 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-stone-900 flex items-center justify-center text-amber-400 border border-stone-800">
                      <UtensilsCrossed className="w-4 h-4" />
                    </span>
                    <span>Explore Menu</span>
                  </span>
                  <ArrowRight className="w-4 h-4 opacity-40" />
                </button>

                {/* 3. Special Offers */}
                <button
                  type="button"
                  onClick={handleSpecialOffers}
                  className="w-full text-left py-3 px-3.5 rounded-2xl text-sm font-semibold text-stone-200 hover:bg-stone-900 hover:text-white transition-all flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-amber-950/60 flex items-center justify-center text-amber-400 border border-amber-800/80">
                      <Tag className="w-4 h-4" />
                    </span>
                    <span className="flex items-center gap-2">
                      <span>Special Offers</span>
                      <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Deals
                      </span>
                    </span>
                  </span>
                  <ArrowRight className="w-4 h-4 opacity-40" />
                </button>

                {/* 4. Contact / WhatsApp */}
                <button
                  type="button"
                  onClick={handleContactWhatsApp}
                  className={`w-full text-left py-3 px-3.5 rounded-2xl text-sm font-semibold transition-all flex items-center justify-between cursor-pointer ${
                    currentView === 'contact'
                      ? 'bg-amber-600/20 text-amber-400 font-bold border border-amber-600/30'
                      : 'text-stone-200 hover:bg-stone-900 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-emerald-950/60 flex items-center justify-center text-emerald-400 border border-emerald-800/80">
                      <MessageCircle className="w-4 h-4" />
                    </span>
                    <span>Contact / WhatsApp</span>
                  </span>
                  <ArrowRight className="w-4 h-4 opacity-40" />
                </button>

                {/* Divider between public browsing and portal logins */}
                <div className="pt-2 pb-1 border-t border-stone-800/80 my-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 px-3">
                    Portals & Management
                  </span>
                </div>

                {/* 5. Admin Login */}
                <button
                  type="button"
                  onClick={() => handleLinkClick('admin')}
                  className={`w-full text-left py-3 px-3.5 rounded-2xl text-sm font-semibold transition-all flex items-center justify-between cursor-pointer ${
                    currentView === 'admin'
                      ? 'bg-amber-600 text-white font-bold'
                      : 'text-amber-300 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/60'
                  }`}
                  title="Admin Portal Login"
                >
                  <span className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-amber-900/60 flex items-center justify-center text-amber-300 border border-amber-700/60">
                      <Shield className="w-4 h-4" />
                    </span>
                    <span>Admin Login</span>
                  </span>
                  <ArrowRight className="w-4 h-4 opacity-60" />
                </button>

                {/* 6. Delivery Boy Login */}
                <button
                  type="button"
                  onClick={() => handleLinkClick('delivery-login')}
                  className={`w-full text-left py-3 px-3.5 rounded-2xl text-sm font-semibold transition-all flex items-center justify-between cursor-pointer ${
                    currentView === 'delivery-login'
                      ? 'bg-amber-600 text-white font-bold'
                      : 'text-sky-300 bg-sky-950/40 hover:bg-sky-900/50 border border-sky-800/60'
                  }`}
                  title="Delivery Boy Login Portal"
                >
                  <span className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-sky-900/60 flex items-center justify-center text-sky-300 border border-sky-700/60">
                      <Truck className="w-4 h-4" />
                    </span>
                    <span>Delivery Boy Login</span>
                  </span>
                  <ArrowRight className="w-4 h-4 opacity-60" />
                </button>

                {/* Admin CMS shortcut if already authenticated */}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleLinkClick('admin')}
                    className="w-full text-left py-2.5 px-3.5 rounded-xl text-xs font-bold text-amber-400 bg-stone-900 hover:bg-stone-800 flex items-center justify-between cursor-pointer border border-amber-800/50 mt-1"
                  >
                    <span className="flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5" />
                      <span>Admin CMS Portal (Active Session)</span>
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-40" />
                  </button>
                )}
              </div>

              {/* Secondary Restaurant Info Links */}
              <div className="mt-5 pt-4 border-t border-stone-800/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-2 px-1">
                  More Pages
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {secondaryLinks.map(sec => {
                    const SecIcon = sec.icon;
                    return (
                      <button
                        key={sec.view}
                        type="button"
                        onClick={() => handleLinkClick(sec.view)}
                        className={`text-left py-2 px-2.5 rounded-xl text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer ${
                          currentView === sec.view
                            ? 'bg-amber-600/20 text-amber-400 font-bold'
                            : 'text-stone-400 hover:bg-stone-900 hover:text-stone-200'
                        }`}
                      >
                        <SecIcon className="w-3.5 h-3.5 text-stone-500" />
                        <span>{sec.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Restaurant Info & Call Actions */}
            <div className="pt-4 border-t border-stone-800/80 flex flex-col gap-3 text-xs text-stone-400">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    openStatus.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-stone-500'
                  }`}
                />
                <span className="font-semibold text-stone-200">{openStatus.statusText}</span>
              </div>

              <div className="flex flex-col gap-2 pt-2 border-t border-stone-900">
                {settings.phone && (
                  <a
                    href={`tel:${settings.phone.replace(/[^0-9+]/g, '')}`}
                    className="inline-flex items-center gap-2 text-stone-300 hover:text-amber-400 font-semibold"
                    title="Call Restaurant Directly"
                  >
                    <Phone className="w-3.5 h-3.5 text-amber-400" />
                    <span>{settings.phone}</span>
                  </a>
                )}

                {orderUrl && (
                  <a
                    href={orderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-semibold"
                    title="Chat on WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>WhatsApp Order Chat</span>
                  </a>
                )}
              </div>

              <div className="text-[11px] text-stone-500 leading-relaxed">
                {settings.address}, {settings.city}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}



