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
import { InstagramSection } from './components/home/InstagramSection.tsx';
import { ContactSection } from './components/home/ContactSection.tsx';
import { Footer } from './components/layout/Footer.tsx';
import { MobileStickyCta } from './components/layout/MobileStickyCta.tsx';
import { CartDrawer } from './components/cart/CartDrawer.tsx';
import { OneBiteLogo } from './components/common/OneBiteLogo.tsx';
import { NotFoundPage } from './components/common/NotFoundPage.tsx';
import { CheckoutPage } from './components/checkout/CheckoutPage.tsx';
import { PrivacyPolicyPage } from './components/legal/PrivacyPolicyPage.tsx';
import { TermsConditionsPage } from './components/legal/TermsConditionsPage.tsx';
import { ErrorBoundary } from './components/common/ErrorBoundary.tsx';
import { AlertCircle } from 'lucide-react';
import { initGlobalButtonSound } from './utils/sound.ts';
import { OrderSuccessModal } from './components/common/OrderSuccessModal.tsx';
import { OfflineIndicator } from './components/common/OfflineIndicator.tsx';
import { deliveryAuthStorage } from './services/api.ts';

const AdminLayout = React.lazy(() =>
  import('./components/admin/AdminLayout.tsx').then(m => ({ default: m.AdminLayout }))
);
const AdminLogin = React.lazy(() =>
  import('./components/admin/AdminLogin.tsx').then(m => ({ default: m.AdminLogin }))
);
const DeliveryDashboard = React.lazy(() =>
  import('./components/delivery/DeliveryDashboard.tsx').then(m => ({ default: m.DeliveryDashboard }))
);
const DeliveryLogin = React.lazy(() =>
  import('./components/delivery/DeliveryLogin.tsx').then(m => ({ default: m.DeliveryLogin }))
);
const MyOrdersPage = React.lazy(() =>
  import('./components/orders/MyOrdersPage.tsx').then(m => ({ default: m.MyOrdersPage }))
);
import { OrderTrackingModal } from './components/orders/OrderTrackingModal.tsx';
import { CustomerOnboardingModal } from './components/auth/CustomerOnboardingModal.tsx';
import { RestaurantClosedModal } from './components/common/RestaurantClosedModal.tsx';
import { CustomerOrder } from './types/index.ts';

function pathToView(pathname: string): string {
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/delivery-login')) return 'delivery-login';
  if (pathname.startsWith('/delivery-dashboard') || pathname.startsWith('/delivery')) return 'delivery-dashboard';
  if (pathname === '/my-orders' || pathname === '/orders') return 'my-orders';
  if (pathname === '/' || pathname === '') return 'home';
  if (pathname === '/menu') return 'menu';
  if (pathname === '/checkout') return 'checkout';
  if (pathname === '/about') return 'about';
  if (pathname === '/gallery') return 'gallery';
  if (pathname === '/reviews') return 'reviews';
  if (pathname === '/location') return 'location';
  if (pathname === '/contact') return 'contact';
  if (pathname === '/privacy') return 'privacy';
  if (pathname === '/terms') return 'terms';
  return 'not-found';
}

function viewToPath(view: string): string {
  if (view === 'home') return '/';
  if (view === 'admin') return '/admin';
  if (view === 'delivery-login') return '/delivery-login';
  if (view === 'delivery-dashboard') return '/delivery-dashboard';
  if (view === 'my-orders') return '/my-orders';
  if (view === 'checkout') return '/checkout';
  if (view === 'privacy') return '/privacy';
  if (view === 'terms') return '/terms';
  if (view === 'not-found') return '/404';
  return `/${view}`;
}

function MainContent() {
  const {
    settings,
    isLoading,
    error,
    isAdmin,
    refreshData,
    celebrationOrder,
    celebrationWhatsappUrl,
    dismissOrderCelebration,
    setIsCartOpen,
    isClosedModalOpen,
    setIsClosedModalOpen,
  } = useRestaurant();
  const [currentView, setCurrentView] = useState<string>(() => {
    return pathToView(window.location.pathname);
  });
  const [activeTrackingOrder, setActiveTrackingOrder] = useState<CustomerOrder | null>(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // Initialize subtle pop sound on button clicks across the site
  useEffect(() => {
    const cleanup = initGlobalButtonSound();
    return cleanup;
  }, []);

  // Dynamic Page Titles and Meta Descriptions
  useEffect(() => {
    const titles: Record<string, { title: string; desc: string }> = {
      home: {
        title: 'One Bite Motihari | Good Food. Great Mood.',
        desc: 'Official website for One Bite restaurant in Motihari, Bihar. Discover delicious burgers, pizzas, sandwiches, wraps, shakes, location at Bagaha Dhala Road, opening hours, and direct ordering.',
      },
      menu: {
        title: 'Menu & Prices | One Bite Motihari',
        desc: 'Explore the complete menu of One Bite Motihari: Handcrafted burgers, fresh dough pizzas, crispy chicken buckets, potato tornados, cheesy wraps, and desserts.',
      },
      'my-orders': {
        title: 'My Orders & Live Order Tracking | One Bite Motihari',
        desc: 'View your previous orders and real-time live status tracking from One Bite Motihari.',
      },
      checkout: {
        title: 'Home Delivery Checkout | One Bite Motihari',
        desc: 'Place your home delivery order with One Bite Motihari. Pay on Delivery only (Cash or QR code to delivery boy). Direct WhatsApp order confirmation.',
      },
      about: {
        title: 'About Us | One Bite Motihari - Family Restaurant',
        desc: 'Learn about One Bite Motihari. Part of India’s fast-growing quick-service food brand with over 400+ outlets, serving fresh, handcrafted food made to order.',
      },
      gallery: {
        title: 'Food & Ambience Gallery | One Bite Motihari',
        desc: 'Browse mouth-watering photos of our signature fast food, delicious pizzas, burgers, shakes, and the cozy dine-in experience at One Bite Motihari.',
      },
      reviews: {
        title: 'Customer Reviews & Ratings | One Bite Motihari',
        desc: 'Read genuine reviews and feedback from food lovers across Motihari who dine and order from One Bite restaurant.',
      },
      location: {
        title: 'Location & Opening Hours | One Bite Motihari',
        desc: 'Find One Bite Motihari at Arya Samaj Chowk, Motihari, Bihar. View working hours, Google Maps directions, and contact information.',
      },
      contact: {
        title: 'Contact Us & Direct Order | One Bite Motihari',
        desc: 'Get in touch with One Bite Motihari. Call directly or chat via WhatsApp to place fast dine-in, takeaway, or delivery food orders.',
      },
      privacy: {
        title: 'Privacy Policy | One Bite Motihari',
        desc: 'Privacy Policy for One Bite restaurant in Motihari, Bihar. Explains how customer data is kept private and secure.',
      },
      terms: {
        title: 'Terms & Conditions | One Bite Motihari',
        desc: 'Terms and conditions for orders, dine-in service, takeaway, and food delivery at One Bite Motihari.',
      },
      admin: {
        title: 'Admin Portal | One Bite Motihari CMS',
        desc: 'Secure restaurant owner management portal for One Bite Motihari.',
      },
      'not-found': {
        title: 'Page Not Found (404) | One Bite Motihari',
        desc: 'The page you requested could not be found. Explore our delicious menu or return to the One Bite Motihari home page.',
      },
    };

    const currentMeta = titles[currentView] || titles.home;
    document.title = currentMeta.title;

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', currentMeta.desc);

    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', currentMeta.title);

    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', currentMeta.desc);
  }, [currentView]);

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

  const handleContinueBrowsing = () => {
    dismissOrderCelebration();
    setIsCartOpen(false);
    if (currentView === 'checkout') {
      navigateTo('menu');
    }
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
    const adminFallback = (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center text-white p-4">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-xs text-stone-400">Loading Admin Portal...</span>
      </div>
    );

    if (isAdmin) {
      return (
        <React.Suspense fallback={adminFallback}>
          <AdminLayout onViewLiveSite={() => navigateTo('home')} />
        </React.Suspense>
      );
    }
    return (
      <React.Suspense fallback={adminFallback}>
        <AdminLogin
          onSuccess={() => navigateTo('admin')}
          onBackToSite={() => navigateTo('home')}
        />
      </React.Suspense>
    );
  }

  // Delivery Boy Portal View (/delivery-login, /delivery-dashboard, /delivery)
  if (currentView === 'delivery-login' || currentView === 'delivery-dashboard') {
    const deliveryFallback = (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center text-white p-4">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-xs text-stone-400">Loading Delivery Boy Panel...</span>
      </div>
    );

    const hasDeliveryToken = Boolean(deliveryAuthStorage.getToken());

    if (currentView === 'delivery-dashboard' && hasDeliveryToken) {
      return (
        <React.Suspense fallback={deliveryFallback}>
          <DeliveryDashboard
            onLogout={() => navigateTo('delivery-login')}
            onViewLiveSite={() => navigateTo('home')}
          />
        </React.Suspense>
      );
    }

    return (
      <React.Suspense fallback={deliveryFallback}>
        <DeliveryLogin
          onSuccess={() => navigateTo('delivery-dashboard')}
          onBackToSite={() => navigateTo('home')}
        />
      </React.Suspense>
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
    <div className="min-h-screen w-full flex flex-col bg-stone-50 text-stone-900 selection:bg-amber-600 selection:text-white overflow-x-hidden">
      {/* Sticky Header */}
      <Navbar
        currentView={currentView}
        onNavigate={navigateTo}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
      />

      {/* Main Body */}
      <main className="flex-1">
        {/* VIEW: HOME */}
        {currentView === 'home' && (
          <>
            {enabled.hero && (
              <Hero
                onNavigateToMenu={() => navigateTo('menu')}
                onNavigateToCheckout={() => navigateTo('checkout')}
              />
            )}
            {enabled.offers && <OffersSection />}
            {enabled.popularItems && (
              <PopularPicks onViewAllMenu={() => navigateTo('menu')} />
            )}
            {enabled.menu && (
              <MenuSection
                onNavigateToCheckout={() => navigateTo('checkout')}
              />
            )}
            {enabled.about && <AboutSection />}
            {enabled.whyChooseUs && <WhyChooseUs />}
            {enabled.gallery && <GallerySection />}
            {enabled.location && <LocationSection />}
            {enabled.reviews && <ReviewsSection />}
            {(enabled.instagram ?? true) && <InstagramSection />}
            {enabled.contact && <ContactSection />}
          </>
        )}

        {/* VIEW: MENU */}
        {currentView === 'menu' && (
          <MenuSection
            isStandalonePage
            onNavigateToCheckout={() => navigateTo('checkout')}
          />
        )}

        {/* VIEW: MY ORDERS & LIVE TRACKING */}
        {currentView === 'my-orders' && (
          <React.Suspense
            fallback={
              <div className="min-h-screen bg-stone-900 flex flex-col items-center justify-center text-white p-4">
                <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-3" />
                <span className="text-xs text-stone-400">Loading your orders...</span>
              </div>
            }
          >
            <MyOrdersPage
              onBackToMenu={() => navigateTo('menu')}
              onNavigateHome={() => navigateTo('home')}
            />
          </React.Suspense>
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

        {/* VIEW: CHECKOUT */}
        {currentView === 'checkout' && (
          <div className="pt-20">
            <CheckoutPage onNavigate={navigateTo} />
          </div>
        )}

        {/* VIEW: PRIVACY POLICY */}
        {currentView === 'privacy' && (
          <PrivacyPolicyPage onNavigate={navigateTo} />
        )}

        {/* VIEW: TERMS AND CONDITIONS */}
        {currentView === 'terms' && (
          <TermsConditionsPage onNavigate={navigateTo} />
        )}

        {/* VIEW: NOT FOUND (404) */}
        {currentView === 'not-found' && (
          <div className="pt-20">
            <NotFoundPage onNavigate={navigateTo} />
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer onNavigate={navigateTo} />

      {/* Mobile Bottom Sticky CTA */}
      <MobileStickyCta currentView={currentView} onNavigate={navigateTo} />

      {/* Cart & Pay on Delivery Drawer */}
      <CartDrawer />

      {/* Order Success Celebration Modal */}
      <OrderSuccessModal
        isOpen={Boolean(celebrationOrder)}
        order={celebrationOrder}
        whatsappUrl={celebrationWhatsappUrl}
        onClose={dismissOrderCelebration}
        onContinueBrowsing={handleContinueBrowsing}
        onTrackOrder={() => {
          if (celebrationOrder) {
            setActiveTrackingOrder(celebrationOrder);
          }
        }}
      />

      {/* Standalone Live Order Tracking Modal */}
      {activeTrackingOrder && (
        <OrderTrackingModal
          order={activeTrackingOrder}
          isOpen={Boolean(activeTrackingOrder)}
          onClose={() => setActiveTrackingOrder(null)}
          onOrderUpdated={(updated) => {
            setActiveTrackingOrder(updated);
          }}
        />
      )}

      {/* Customer Google Onboarding Modal */}
      <CustomerOnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onSuccessRole={(role) => {
          if (role === 'admin') {
            navigateTo('admin');
          } else {
            navigateTo('my-orders');
          }
        }}
      />

      {/* Restaurant Operating Hours Closed Modal */}
      <RestaurantClosedModal
        isOpen={isClosedModalOpen}
        onClose={() => setIsClosedModalOpen(false)}
      />

      {/* Connectivity Status Indicator */}
      <OfflineIndicator />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <RestaurantProvider>
          <MainContent />
        </RestaurantProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
