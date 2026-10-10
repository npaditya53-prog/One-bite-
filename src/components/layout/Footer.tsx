import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext.tsx';
import { OneBiteLogo } from '../common/OneBiteLogo.tsx';
import { Phone, MessageSquare, MapPin, Instagram, Facebook, Shield, Heart } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  const { settings, openStatus } = useRestaurant();
  const [modalType, setModalType] = useState<'privacy' | 'terms' | null>(null);

  const cleanPhone = settings.whatsapp ? settings.whatsapp.replace(/[^0-9]/g, '') : '';
  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent('Hello One Bite Motihari, I have an inquiry.')}`
    : settings.orderUrl;

  return (
    <footer className="bg-stone-950 text-stone-300 border-t border-stone-800 pt-16 pb-24 sm:pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Col 1 & 2: Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="mb-2">
              <OneBiteLogo size="lg" showLocation />
            </div>

            <p className="text-xs sm:text-sm text-stone-400 leading-relaxed max-w-sm">
              {settings.description}
            </p>

            <div className="flex items-center gap-3 pt-2">
              {settings.instagramUrl && (
                <a
                  href={settings.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-white flex items-center justify-center border border-stone-800 transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {settings.facebookUrl && (
                <a
                  href={settings.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-white flex items-center justify-center border border-stone-800 transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </a>
              )}
              {cleanPhone && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg bg-emerald-950 text-emerald-400 hover:bg-emerald-900 flex items-center justify-center border border-emerald-800/60 transition-colors"
                  aria-label="WhatsApp"
                >
                  <MessageSquare className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Col 3: Quick Navigation */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <button
                  onClick={() => onNavigate('home')}
                  className="hover:text-amber-400 transition-colors cursor-pointer"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('menu')}
                  className="hover:text-amber-400 transition-colors cursor-pointer"
                >
                  Full Menu
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('about')}
                  className="hover:text-amber-400 transition-colors cursor-pointer"
                >
                  About Restaurant
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('gallery')}
                  className="hover:text-amber-400 transition-colors cursor-pointer"
                >
                  Photo Gallery
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('reviews')}
                  className="hover:text-amber-400 transition-colors cursor-pointer"
                >
                  Customer Reviews
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Business Hours */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Opening Hours
            </h4>
            <div className="space-y-2 text-xs text-stone-400 leading-relaxed">
              <div className="flex items-center gap-2 text-stone-200 font-semibold mb-1">
                <span
                  className={`w-2 h-2 rounded-full ${
                    openStatus.isOpen ? 'bg-emerald-400' : 'bg-rose-400'
                  }`}
                />
                <span>{openStatus.isOpen ? 'Open Now' : 'Closed'}</span>
              </div>
              <p>Monday – Friday: 11:00 AM – 10:00 PM</p>
              <p>Saturday – Sunday: 11:00 AM – 10:30 PM</p>
              <p className="text-amber-400/90 pt-1">Dine-in, Takeaway & Delivery</p>
            </div>
          </div>

          {/* Col 5: Location & Admin */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Outlet Location
            </h4>
            <div className="text-xs text-stone-400 space-y-2 mb-4">
              <p>{settings.address}</p>
              <p>Rajendra Nagar, Motihari</p>
              <p>Bihar 845401, India</p>
            </div>

            {settings.phone && (
              <a
                href={`tel:${settings.phone}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 block mb-4"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{settings.phone}</span>
              </a>
            )}

            <button
              onClick={() => onNavigate('admin')}
              className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-300 transition-colors"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Owner Admin Login</span>
            </button>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-stone-800/80 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <p>
            © {new Date().getFullYear()} {settings.restaurantName}. All rights reserved.
          </p>

          <div className="flex items-center gap-6">
            <button
              onClick={() => setModalType('privacy')}
              className="hover:text-stone-300 transition-colors"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => setModalType('terms')}
              className="hover:text-stone-300 transition-colors"
            >
              Terms of Service
            </button>
            <span className="text-stone-600 hidden sm:inline">·</span>
            <span className="hidden sm:inline">Bagaha Dhala Road, Motihari</span>
          </div>
        </div>
      </div>

      {/* Privacy Policy / Terms Modal */}
      {modalType && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setModalType(null)}
        >
          <div
            className="bg-white text-stone-900 rounded-2xl p-6 sm:p-8 max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4">
              {modalType === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
            </h3>
            <div className="text-xs sm:text-sm text-stone-600 space-y-3 leading-relaxed mb-6">
              {modalType === 'privacy' ? (
                <>
                  <p>
                    One Bite Motihari respects your personal privacy. We only collect contact
                    details necessary for food preparation, order confirmation, and delivery coordination.
                  </p>
                  <p>
                    We never sell or share your phone numbers or contact data with third-party advertisers.
                  </p>
                  <p>
                    For questions regarding orders or personal data, you can reach out directly to us at our Bagaha Dhala Road branch or via our official WhatsApp line.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    All menu prices are in Indian Rupees (₹) and are subject to availability.
                  </p>
                  <p>
                    Food is prepared fresh to order. For party or bulk orders, advance notice is appreciated.
                  </p>
                  <p>
                    Store hours and delivery radius around Motihari are determined by local operational conditions.
                  </p>
                </>
              )}
            </div>
            <button
              onClick={() => setModalType(null)}
              className="w-full py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white font-semibold rounded-xl text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </footer>
  );
}
