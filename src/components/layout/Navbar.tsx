import React, { useState, useEffect } from 'react';
import { useRestaurant } from '../../context/RestaurantContext.tsx';
import { OneBiteLogo } from '../common/OneBiteLogo.tsx';
import { Menu, X, Phone, ShoppingBag, Shield, ArrowRight } from 'lucide-react';
import { SoundToggle } from '../common/SoundToggle.tsx';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export function Navbar({ currentView, onNavigate }: NavbarProps) {
  const { settings, openStatus, isAdmin, cart, setIsCartOpen } = useRestaurant();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock background scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    { label: 'Home', view: 'home' },
    { label: 'Menu', view: 'menu' },
    { label: 'About', view: 'about' },
    { label: 'Gallery', view: 'gallery' },
    { label: 'Reviews', view: 'reviews' },
    { label: 'Location', view: 'location' },
    { label: 'Contact', view: 'contact' },
  ];

  const handleLinkClick = (view: string) => {
    setMobileMenuOpen(false);
    onNavigate(view);
  };

  const cleanPhone = settings.whatsapp ? settings.whatsapp.replace(/[^0-9]/g, '') : '';
  const orderUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent('Hello One Bite Motihari, I would like to place an order.')}`
    : settings.orderUrl;

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
            {navLinks.map(link => (
              <button
                key={link.view}
                onClick={() => handleLinkClick(link.view)}
                className={`text-sm font-semibold transition-colors cursor-pointer py-1 ${
                  currentView === link.view
                    ? 'text-amber-400 border-b-2 border-amber-400'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                {link.label}
              </button>
            ))}

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

          {/* Desktop Right CTA Bar */}
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

            {/* Sound Effects Mute / Unmute Toggle */}
            <SoundToggle showLabel />

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

            {isAdmin && (
              <button
                onClick={() => handleLinkClick('admin')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-950/60 text-amber-300 border border-amber-800/80 hover:bg-amber-900/60 text-xs font-semibold transition-colors cursor-pointer"
                title="Admin Panel"
              >
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>Admin CMS</span>
              </button>
            )}
          </div>

          {/* Mobile & Tablet Right Controls (< 1024px) */}
          <div className="flex lg:hidden items-center gap-1.5">
            <SoundToggle />

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

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-stone-900 text-stone-200 hover:text-white border border-stone-800 cursor-pointer"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-stone-950 border-b border-stone-800 px-4 pt-3 pb-6 animate-in slide-in-from-top-2 duration-200">
          <div className="space-y-1 mb-6">
            {navLinks.map(link => (
              <button
                key={link.view}
                onClick={() => handleLinkClick(link.view)}
                className={`w-full text-left py-2.5 px-3 rounded-xl text-sm font-semibold transition-colors flex items-center justify-between ${
                  currentView === link.view
                    ? 'bg-amber-600/20 text-amber-400 font-bold'
                    : 'text-stone-300 hover:bg-stone-900 hover:text-white'
                }`}
              >
                <span>{link.label}</span>
                <ArrowRight className="w-4 h-4 opacity-40" />
              </button>
            ))}

            {isAdmin && (
              <button
                onClick={() => handleLinkClick('admin')}
                className="w-full text-left py-2.5 px-3 rounded-xl text-sm font-semibold text-amber-400 hover:bg-stone-900 flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>Admin CMS Portal</span>
                </span>
                <ArrowRight className="w-4 h-4 opacity-40" />
              </button>
            )}
          </div>

          <div className="pt-4 border-t border-stone-800/80 flex flex-col gap-3 text-xs text-stone-400">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  openStatus.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-stone-500'
                }`}
              />
              <span className="font-medium text-stone-200">{openStatus.statusText}</span>
            </div>

            <div className="flex flex-col gap-2 pt-1 border-t border-stone-900">
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

              {settings.email && (
                <a
                  href={`mailto:${settings.email}`}
                  className="inline-flex items-center gap-2 text-stone-300 hover:text-amber-400 font-semibold"
                  title="Send Email to Restaurant"
                >
                  <span className="text-amber-400 font-bold">@</span>
                  <span>{settings.email}</span>
                </a>
              )}
            </div>

            <div className="text-[11px] text-stone-500">{settings.address}, {settings.city}</div>
          </div>
        </div>
      )}
    </header>
  );
}
