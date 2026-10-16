import React from 'react';
import { useRestaurant } from '../../context/RestaurantContext.tsx';
import { ArrowLeft, FileText, CheckCircle2, Phone, Mail, MapPin } from 'lucide-react';

interface TermsConditionsPageProps {
  onNavigate: (view: string) => void;
}

export function TermsConditionsPage({ onNavigate }: TermsConditionsPageProps) {
  const { settings } = useRestaurant();

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-stone-500 mb-8">
          <button
            onClick={() => onNavigate('home')}
            className="hover:text-amber-700 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>
          <span>/</span>
          <span className="text-stone-800 font-semibold">Terms & Conditions</span>
        </div>

        {/* Header Hero */}
        <div className="bg-stone-900 text-white rounded-3xl p-6 sm:p-10 mb-10 shadow-xl border border-stone-800 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-stone-800 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-4 border border-stone-700">
              <FileText className="w-4 h-4" />
              <span>Restaurant Service Terms</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3">
              Terms & Conditions
            </h1>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              Last updated: October 2026. These terms govern orders, dine-in service, takeaway, and digital communications with One Bite Motihari.
            </p>
          </div>
        </div>

        {/* Content Sections */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-stone-200/90 space-y-8 text-sm text-stone-700 leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 text-xs font-black flex items-center justify-center">
                1
              </span>
              <span>Menu Items, Availability & Pricing</span>
            </h2>
            <p>
              All prices shown on this website are in Indian Rupees (₹) and inclusive of applicable taxes unless specified otherwise. We make every effort to display up-to-date pricing and accurate descriptions. However, ingredient availability and seasonal specials may change without prior notice.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 text-xs font-black flex items-center justify-center">
                2
              </span>
              <span>Fresh Food Preparation & Ordering</span>
            </h2>
            <p>
              Every burger, pizza, potato tornado, and shake is handcrafted fresh to order. When you submit an order through our digital cart, it connects directly with our restaurant team via WhatsApp or phone. An order is finalized once our team confirms preparation and payment arrangement with you.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 text-xs font-black flex items-center justify-center">
                3
              </span>
              <span>Dine-In, Takeaway & Delivery Service</span>
            </h2>
            <ul className="space-y-2 pl-4">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Dine-In:</strong> Seating is offered on a first-come, first-served basis. For party reservations and large group bookings, advance notice is appreciated.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Takeaway:</strong> Pick up directly from our outlet at {settings.address}, Motihari. Orders are held hot and crisp for prompt pickup.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Delivery:</strong> Local delivery service across Motihari is subject to distance, courier availability, and weather conditions.</span>
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 text-xs font-black flex items-center justify-center">
                4
              </span>
              <span>Cancellations & Modifications</span>
            </h2>
            <p>
              Because our culinary team starts frying, grilling, and baking dishes immediately upon confirmation, cancellations or modifications must be notified within 3 minutes of confirmation. Once food is prepared, orders cannot be cancelled.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 text-xs font-black flex items-center justify-center">
                5
              </span>
              <span>Allergens & Dietary Information</span>
            </h2>
            <p>
              We maintain dedicated preparation stations for vegetarian and non-vegetarian recipes. However, our kitchen handles dairy, wheat, gluten, nuts, and soybeans. If you or any member of your party has severe food allergies, please inform our staff directly before placing your order.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 text-xs font-black flex items-center justify-center">
                6
              </span>
              <span>Governing Law & Contact</span>
            </h2>
            <p>
              These terms are governed by the laws of India and subject to the exclusive jurisdiction of the competent courts in Motihari, East Champaran, Bihar.
            </p>
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex flex-col sm:flex-row gap-4 justify-between mt-4">
              <div>
                <p className="font-bold text-stone-900">One Bite Motihari</p>
                <p className="text-xs text-stone-600">{settings.address}, Motihari, Bihar {settings.pincode}</p>
              </div>
              <div className="flex flex-col sm:items-end gap-1 text-xs font-medium">
                {settings.phone && (
                  <a href={`tel:${settings.phone}`} className="text-amber-700 hover:text-amber-800 font-bold">
                    Phone: {settings.phone}
                  </a>
                )}
                {settings.email && (
                  <a href={`mailto:${settings.email}`} className="text-stone-700 hover:text-stone-900">
                    Email: {settings.email}
                  </a>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Back button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => {
              onNavigate('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Homepage</span>
          </button>
        </div>
      </div>
    </div>
  );
}
