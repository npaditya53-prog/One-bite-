import React, { useState, useEffect } from 'react';
import { useRestaurant } from '../../context/RestaurantContext.tsx';
import { OneBiteLogo } from '../common/OneBiteLogo.tsx';
import {
  Menu,
  X,
  Phone,
  ShoppingBag,
  Shield,
  ArrowRight,
  Clock,
  LogIn,
  LogOut,
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenOnboarding?: () => void;
}

export function Navbar({ currentView, onNavigate, onOpenOnboarding }: NavbarProps) {
  const {
    settings,
    openStatus,
    isAdmin,
    cart,
    setIsCartOpen,
    firebaseUser,
    customerOrders,
    logout,
  } = useRestaurant();
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
    { label: 'My Orders', view: 'my-orders' },
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
            {navLinks.map((link) => (
              <button
                key={link.view}
                onClick={() => handleLinkClick(link.view)}
                className={`text-sm font-semibold transition-colors cursor-pointer py-1 flex items-center gap-1.5 ${
                  currentView === link.view
                    ? 'text-amber-400 border-b-2 border-amber-400'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                <span>{link.label}</span>
                {link.view === 'my-orders' && customerOrders.length > 0 && (
                  <span className="bg-amber-600 text-white font-black text-[10px] px-1.5 py-0.2 rounded-full">
                    {customerOrders.length}
                  </span>
                )}
              </button>
            ))}

            {isAdmin && (
              <button
                onClick={() => handleLinkClick('admin')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-950/60 text-amber-300 border border-amber-800/80 hover:bg-amber-900/60 transition-colors cursor-pointer"
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

            {/* Customer Account / Sign In */}
            {firebaseUser ? (
              <div className="flex items-center gap-1 bg-stone-900 border border-stone-800 rounded-xl p-1 pr-2">
                <button
                  type="button"
                  onClick={() => handleLinkClick('my-orders')}
                  className="flex items-center gap-2 px-2 py-1 text-xs font-bold text-stone-200 hover:text-white cursor-pointer"
                  title="View My Orders & Track Live"
                >
                  {firebaseUser.photoURL ? (
                    <img
                      src={firebaseUser.photoURL}
                      alt={firebaseUser.displayName || 'Customer'}
                      className="w-5 h-5 rounded-full object-cover border border-amber-500/50"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-amber-600 text-white text-[10px] font-black flex items-center justify-center">
                      {(firebaseUser.displayName || firebaseUser.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <span className="truncate max-w-[90px]">
                    {firebaseUser.displayName?.split(' ')[0] || 'Orders'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                  }}
                  className="text-stone-500 hover:text-rose-400 p-1 rounded-md transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : onOpenOnboarding ? (
              <button
                type="button"
                onClick={onOpenOnboarding}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-stone-200 hover:text-white hover:bg-stone-900 text-xs font-semibold border border-stone-800 transition-colors cursor-pointer"
                title="Sign in with Google"
              >
                <LogIn className="w-3.5 h-3.5 text-amber-400" />
                <span>Sign In</span>
              </button>
            ) : null}

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
              <span>ADMIN</span>
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
        <div className="lg:hidden bg-stone-950 border-b border-stone-800 px-4 pt-3 pb-6 animate-in slide-in-from-top-2 duration-200 max-h-[85vh] overflow-y-auto">
          {/* Mobile User Profile or Google Sign In */}
          {firebaseUser ? (
            <div className="p-3 bg-stone-900/90 rounded-2xl border border-stone-800 flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                {firebaseUser.photoURL ? (
                  <img
                    src={firebaseUser.photoURL}
                    alt="Customer"
                    className="w-8 h-8 rounded-full object-cover border border-amber-500/50"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center text-xs">
                    {(firebaseUser.displayName || firebaseUser.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="text-left text-xs">
                  <div className="font-bold text-white leading-tight truncate max-w-[150px]">
                    {firebaseUser.displayName || 'Customer'}
                  </div>
                  <div className="text-[10px] text-stone-400 truncate max-w-[150px]">
                    {firebaseUser.email}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={async () => {
                  setMobileMenuOpen(false);
                  await logout();
                }}
                className="px-2.5 py-1 text-[11px] font-semibold text-stone-400 hover:text-white bg-stone-800 hover:bg-stone-700 rounded-lg transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          ) : onOpenOnboarding ? (
            <div className="mb-4">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenOnboarding();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-stone-100 text-stone-900 font-extrabold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Sign In with Google</span>
              </button>
            </div>
          ) : null}

          {/* Navigation Links */}
          <div className="space-y-1 mb-6">
            {navLinks.map((link) => (
              <button
                key={link.view}
                onClick={() => handleLinkClick(link.view)}
                className={`w-full text-left py-2.5 px-3 rounded-xl text-sm font-semibold transition-colors flex items-center justify-between ${
                  currentView === link.view
                    ? 'bg-amber-600/20 text-amber-400 font-bold'
                    : 'text-stone-300 hover:bg-stone-900 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2">
                  {link.view === 'my-orders' && <Clock className="w-4 h-4 text-amber-400" />}
                  <span>{link.label}</span>
                </span>
                <div className="flex items-center gap-1.5">
                  {link.view === 'my-orders' && customerOrders.length > 0 && (
                    <span className="bg-amber-600 text-white font-black text-[10px] px-1.5 py-0.2 rounded-full">
                      {customerOrders.length}
                    </span>
                  )}
                  <ArrowRight className="w-4 h-4 opacity-40" />
                </div>
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

            <div className="text-[11px] text-stone-500">
              {settings.address}, {settings.city}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
