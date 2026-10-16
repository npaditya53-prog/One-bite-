import React from 'react';
import { useRestaurant } from '../../context/RestaurantContext.tsx';
import { OneBiteLogo } from '../common/OneBiteLogo.tsx';
import { ShieldCheck, ArrowLeft, Phone, Mail, MapPin, Lock, FileText, CheckCircle2 } from 'lucide-react';

interface PrivacyPolicyPageProps {
  onNavigate: (view: string) => void;
}

export function PrivacyPolicyPage({ onNavigate }: PrivacyPolicyPageProps) {
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
          <span className="text-stone-800 font-semibold">Privacy Policy</span>
        </div>

        {/* Header Hero */}
        <div className="bg-stone-900 text-white rounded-3xl p-6 sm:p-10 mb-10 shadow-xl border border-stone-800 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-stone-800 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-4 border border-stone-700">
              <ShieldCheck className="w-4 h-4" />
              <span>Customer Data Protection</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3">
              Privacy Policy
            </h1>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              Last updated: October 2026. This policy explains how One Bite Motihari collects, uses, and safeguards information when you visit our website, view our menu, or order food.
            </p>
          </div>
        </div>

        {/* Policy Content Sections */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-stone-200/90 space-y-8 text-sm text-stone-700 leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 text-xs font-black flex items-center justify-center">
                1
              </span>
              <span>About One Bite Motihari</span>
            </h2>
            <p>
              ONE BITE is a family restaurant outlet located at {settings.address}, {settings.city}, {settings.state} {settings.pincode}. We specialize in handcrafted burgers, fresh dough pizzas, potato tornados, chicken buckets, wraps, waffles, and beverages.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 text-xs font-black flex items-center justify-center">
                2
              </span>
              <span>Information We Collect</span>
            </h2>
            <p>
              We collect only the minimal information necessary to prepare and deliver your meal accurately:
            </p>
            <ul className="space-y-2 pl-4">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Contact Details:</strong> Your name and 10-digit mobile phone number for order coordination and confirmation.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Order Details:</strong> Selected menu items, quantities, dietary instructions, and table number (for dine-in) or local delivery address in Motihari.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Technical Log Data:</strong> Basic standard browser technical metrics (IP address, device type) required to deliver web pages securely and prevent automated abuse.</span>
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 text-xs font-black flex items-center justify-center">
                3
              </span>
              <span>How We Use Your Information</span>
            </h2>
            <p>
              Your information is used strictly for culinary and operational purposes:
            </p>
            <ul className="space-y-1.5 list-disc pl-6 text-stone-600">
              <li>Preparing food hot and crisp to your exact customization.</li>
              <li>Generating your direct WhatsApp order dispatch message to our staff.</li>
              <li>Coordinating local delivery to your home or office in Motihari.</li>
              <li>Responding to customer service inquiries or dietary questions.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 text-xs font-black flex items-center justify-center">
                4
              </span>
              <span>No Sale or Renting of Customer Data</span>
            </h2>
            <p>
              We <strong>never sell, lease, trade, or share</strong> your personal contact details or order history with third-party advertising networks, data brokers, or telemarketers.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 text-xs font-black flex items-center justify-center">
                5
              </span>
              <span>Security & Infrastructure</span>
            </h2>
            <p>
              Our website uses HTTPS encrypted transmission, strict Content-Security-Policy headers, rate limiting, and authenticated administrative controls to ensure your records remain private.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 text-xs font-black flex items-center justify-center">
                6
              </span>
              <span>Your Rights & Contacting Us</span>
            </h2>
            <p>
              You have the right to inspect or request deletion of any order records associated with your phone number. To exercise these rights or ask questions, reach out to us:
            </p>
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex flex-col sm:flex-row gap-4 justify-between">
              <div>
                <p className="font-bold text-stone-900">One Bite Motihari Branch</p>
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
