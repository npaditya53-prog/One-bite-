import React from 'react';
import { useRestaurant } from '../../context/RestaurantContext.tsx';
import { Phone, MessageSquare, MapPin, Mail, Instagram, Facebook, Clock, ArrowUpRight } from 'lucide-react';

export function ContactSection() {
  const { settings, openStatus } = useRestaurant();

  const cleanPhone = settings.whatsapp ? settings.whatsapp.replace(/[^0-9]/g, '') : '';
  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent('Hello One Bite Motihari, I have an inquiry about the restaurant.')}`
    : settings.orderUrl;

  return (
    <section id="contact" className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs uppercase tracking-widest text-amber-700 font-bold mb-2">
            Get In Touch
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
            Contact & Support
          </h2>
          <p className="mt-2 text-sm text-stone-600">
            Have a question, feedback, or want to order food for a party or celebration? Reach out to us.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Phone */}
          <div className="bg-stone-50/70 p-6 rounded-2xl border border-stone-200/80 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
                <Phone className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-stone-900 mb-1">Direct Call</h3>
              <p className="text-xs text-stone-500 mb-4">Immediate assistance and phone orders</p>
            </div>
            {settings.phone ? (
              <a
                href={`tel:${settings.phone}`}
                className="inline-flex items-center gap-1.5 text-sm font-bold text-amber-700 hover:text-amber-800"
              >
                <span>{settings.phone}</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            ) : (
              <span className="text-xs text-stone-400">Available during open hours</span>
            )}
          </div>

          {/* Card 2: WhatsApp */}
          <div className="bg-stone-50/70 p-6 rounded-2xl border border-stone-200/80 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-stone-900 mb-1">WhatsApp Chat</h3>
              <p className="text-xs text-stone-500 mb-4">Quick takeaway orders & menu inquiries</p>
            </div>
            {cleanPhone ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 hover:text-emerald-800"
              >
                <span>Chat on WhatsApp</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            ) : (
              <span className="text-xs text-stone-400">Not configured</span>
            )}
          </div>

          {/* Card 3: Location */}
          <div className="bg-stone-50/70 p-6 rounded-2xl border border-stone-200/80 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-stone-900 mb-1">Visit Store</h3>
              <p className="text-xs text-stone-500 mb-4">Bagaha Dhala Road, Rajendra Nagar</p>
            </div>
            {settings.mapsUrl ? (
              <a
                href={settings.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-sky-700 hover:text-sky-800"
              >
                <span>Open Directions</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            ) : (
              <span className="text-xs text-stone-400">Motihari, Bihar</span>
            )}
          </div>

          {/* Card 4: Hours & Socials */}
          <div className="bg-stone-50/70 p-6 rounded-2xl border border-stone-200/80 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-stone-900 mb-1">Hours & Socials</h3>
              <p className="text-xs text-stone-500 mb-4">{openStatus.todayScheduleText}</p>
            </div>

            <div className="flex items-center gap-3 pt-2 border-t border-stone-200/60">
              {settings.instagramUrl && (
                <a
                  href={settings.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-stone-200/80 hover:bg-stone-300 text-stone-800 transition-colors"
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
                  className="p-2 rounded-lg bg-stone-200/80 hover:bg-stone-300 text-stone-800 transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </a>
              )}
              {settings.email && (
                <a
                  href={`mailto:${settings.email}`}
                  className="p-2 rounded-lg bg-stone-200/80 hover:bg-stone-300 text-stone-800 transition-colors"
                  aria-label="Email"
                >
                  <Mail className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
