import React, { useState, useEffect } from 'react';
import { RestaurantProvider, useRestaurant } from './context/RestaurantContext.tsx';
import { ToastProvider } from './components/common/Toast.tsx';
import { Navbar } from './components/layout/Navbar.tsx';
import { Hero } from './components/home/Hero.tsx';
import { QuickActions } from './components/home/QuickActions.tsx';
import { OffersSection } from './components/home/OffersSection.tsx';
import { PopularPicks } from './components/home/PopularPicks.tsx';
import { MenuSection } from './components/menu/MenuSection.tsx';
import { AboutSection } from './components/home/AboutSection.tsx';
import { WhyChooseUs } from './components/home/WhyChooseUs.tsx';
import { GallerySection } from './components/gallery/GallerySection.tsx';
import { LocationSection } from './components/location/LocationSection.tsx';
import { ReviewsSection } from './components/home/ReviewsSection.tsx';
import { ContactSection } from './components/home/ContactSection.tsx';
import { Footer } from './components/layout/Footer.tsx';
import { MobileStickyCta } from './components/layout/MobileStickyCta.tsx';
import { AdminLayout } from './components/admin/AdminLayout.tsx';
import { AdminLogin } from './components/admin/AdminLogin.tsx';
import { OneBiteLogo } from './components/common/OneBiteLogo.tsx';
import { AlertCircle } from 'lucide-react';

function pathToView(pathname: string): string {
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname === '/menu') return 'menu';
  if (pathname === '/about') return 'about';
  if (pathname === '/gallery') return 'gallery';
  if (pathname === '/reviews') return 'reviews';
  if (pathname === '/location') return 'location';
  if (pathname === '/contact') return 'contact';
  return 'home';
}

function viewToPath(view: string): string {
  if (view === 'home') return '/';
  if (view === 'admin') return '/admin';
  return `/${view}`;
}

function MainContent() {
  const { settings, isLoading, error, isAdmin, refreshData } = useRestaurant();
  const [currentView, setCurrentView] = useState<string>(() => {
    return pathToView(window.location.pathname);
  });

  // Sync route with URL bar
  useEffect(() => {
    const handlePopState = () => {
      setCurrentView(pathToView(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (view: string) => {
    setCurrentView(view);
    const newPath = viewToPath(view);
    if (window.location.pathname !== newPath) {
      window.history.pushState(null, '', newPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center text-white p-4">
        <div className="mb-4 animate-pulse">
          <OneBiteLogo size="xl" showLocation />
        </div>
        <p className="text-xs text-amber-400 mt-2 font-medium">Preparing fresh flavors...</p>
      </div>
    );
  }

  // Error state
  if (error && !settings) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-stone-900 mb-2">Unable to load restaurant</h2>
        <p className="text-sm text-stone-600 max-w-sm mb-6">{error}</p>
        <button
          onClick={() => refreshData()}
          className="px-5 py-2.5 bg-amber-600 text-white text-xs font-semibold rounded-xl hover:bg-amber-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Admin View
  if (currentView === 'admin') {
    if (isAdmin) {
      return <AdminLayout onViewLiveSite={() => navigateTo('home')} />;
    }
    return (
      <AdminLogin
        onSuccess={() => navigateTo('admin')}
        onBackToSite={() => navigateTo('home')}
      />
    );
  }

  const enabled = settings.sectionsEnabled || {
    hero: true,
    quickActions: true,
    popularItems: true,
    menu: true,
    about: true,
    whyChooseUs: true,
    offers: true,
    gallery: true,
    reviews: true,
    hours: true,
    location: true,
    contact: true,
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 selection:bg-amber-600 selection:text-white">
      {/* Sticky Header */}
      <Navbar currentView={currentView} onNavigate={navigateTo} />

      {/* Main Body */}
      <main className="flex-1">
        {/* VIEW: HOME */}
        {currentView === 'home' && (
          <>
            {enabled.hero && <Hero onNavigateToMenu={() => navigateTo('menu')} />}
            {enabled.quickActions && <QuickActions />}
            {enabled.offers && <OffersSection />}
            {enabled.popularItems && (
              <PopularPicks onViewAllMenu={() => navigateTo('menu')} />
            )}
            {enabled.menu && <MenuSection />}
            {enabled.about && <AboutSection />}
            {enabled.whyChooseUs && <WhyChooseUs />}
            {enabled.gallery && <GallerySection />}
            {enabled.location && <LocationSection />}
            {enabled.reviews && <ReviewsSection />}
            {enabled.contact && <ContactSection />}
          </>
        )}

        {/* VIEW: MENU */}
        {currentView === 'menu' && (
          <MenuSection isStandalonePage />
        )}

        {/* VIEW: ABOUT */}
        {currentView === 'about' && (
          <div className="pt-20">
            <AboutSection />
            <WhyChooseUs />
          </div>
        )}

        {/* VIEW: GALLERY */}
        {currentView === 'gallery' && (
          <GallerySection isStandalonePage />
        )}

        {/* VIEW: REVIEWS */}
        {currentView === 'reviews' && (
          <div className="pt-20">
            <ReviewsSection />
          </div>
        )}

        {/* VIEW: LOCATION */}
        {currentView === 'location' && (
          <div className="pt-20">
            <LocationSection />
          </div>
        )}

        {/* VIEW: CONTACT */}
        {currentView === 'contact' && (
          <div className="pt-20">
            <ContactSection />
            <LocationSection />
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer onNavigate={navigateTo} />

      {/* Mobile Bottom Sticky CTA */}
      <MobileStickyCta currentView={currentView} onNavigate={navigateTo} />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <RestaurantProvider>
        <MainContent />
      </RestaurantProvider>
    </ToastProvider>
  );
}
