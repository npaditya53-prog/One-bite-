import React from 'react';
import { useRestaurant } from '../../context/RestaurantContext.tsx';
import { MapPin, Clock, Navigation, ExternalLink, Phone, MessageSquare } from 'lucide-react';

function formatTime(timeStr: string) {
  if (!timeStr) return '';
  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12;
  return `${h}:${m} ${ampm}`;
}

export function LocationSection() {
  const { settings, businessHours, openStatus } = useRestaurant();

  // Get current day name in IST
  const currentDay = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
  }).format(new Date());

  const cleanPhone = settings.whatsapp ? settings.whatsapp.replace(/[^0-9]/g, '') : '';
  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent('Hello One Bite Motihari, I need directions to your restaurant.')}`
    : settings.orderUrl;

  return (
    <section id="location" className="py-16 sm:py-24 bg-stone-100/70 border-b border-stone-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs uppercase tracking-widest text-amber-700 font-bold mb-2">
            Visit Us
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
            Location & Business Hours
          </h2>
          <p className="mt-2 text-sm text-stone-600">
            Conveniently located on Bagaha Dhala Road in Rajendra Nagar, Motihari.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Details & Opening Hours */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Live Status Card */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      openStatus.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                    }`}
                  />
                  <span
                    className={`text-sm font-bold uppercase tracking-wider ${
                      openStatus.isOpen ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {openStatus.isOpen ? 'Open Now' : 'Closed'}
                  </span>
                </div>

                <span className="text-xs text-stone-500 font-medium">India Time (IST)</span>
              </div>

              <div className="text-base font-bold text-stone-900 mb-1">
                {openStatus.statusText}
              </div>
              <div className="text-xs text-stone-500">
                Today ({currentDay}): {openStatus.todayScheduleText}
              </div>
            </div>

            {/* Address & Contact Quick Info */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-stone-900 mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-amber-600" />
                  <span>Restaurant Address</span>
                </h3>

                <p className="text-sm text-stone-700 leading-relaxed font-medium mb-1">
                  {settings.restaurantName}
                </p>
                <p className="text-sm text-stone-600 leading-relaxed mb-4">
                  {settings.address},<br />
                  Rajendra Nagar, Motihari, Bihar – {settings.pincode}
                </p>

                <div className="space-y-2 border-t border-stone-100 pt-4 mb-6 text-sm text-stone-600">
                  {settings.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-amber-600 shrink-0" />
                      <a href={`tel:${settings.phone}`} className="hover:text-stone-900 font-medium">
                        {settings.phone}
                      </a>
                    </div>
                  )}
                  {settings.whatsapp && (
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-stone-900 font-medium"
                      >
                        {settings.whatsapp} (WhatsApp)
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <a
                  href={settings.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Get Directions</span>
                </a>

                <a
                  href={settings.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs sm:text-sm transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Google Maps</span>
                </a>
              </div>
            </div>

            {/* Opening Hours Schedule Table */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs">
              <h3 className="text-base font-bold text-stone-900 mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <span>Weekly Hours</span>
              </h3>

              <div className="space-y-1.5 text-xs sm:text-sm">
                {businessHours.map(bh => {
                  const isToday = bh.day.toLowerCase() === currentDay.toLowerCase();
                  return (
                    <div
                      key={bh.id}
                      className={`flex items-center justify-between py-1.5 px-2.5 rounded-lg transition-colors ${
                        isToday ? 'bg-amber-50/80 font-bold text-amber-900' : 'text-stone-600'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {bh.day}
                        {isToday && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                            Today
                          </span>
                        )}
                      </span>

                      <span>
                        {bh.closed ? (
                          <span className="text-rose-600">Closed</span>
                        ) : (
                          `${formatTime(bh.openTime)} – ${formatTime(bh.closeTime)}`
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Google Maps Embed Card */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="bg-white p-3 rounded-2xl border border-stone-200/80 shadow-xs h-full min-h-[420px] lg:min-h-[580px] flex flex-col">
              <div className="relative w-full flex-1 rounded-xl overflow-hidden bg-stone-200">
                <iframe
                  title="One Bite Motihari Location on Google Maps"
                  src={
                    settings.mapsEmbedUrl ||
                    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14272.23!2d84.9089!3d26.6497!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x399335!2zTW90aWhhcmksIEJpaGFy!5e0!3m2!1sen!2sin!4v1680000000000!5m2!1sen!2sin'
                  }
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full h-full min-h-[360px]"
                />
              </div>

              <div className="p-3 text-xs text-stone-500 flex items-center justify-between">
                <span>Near Bagaha Dhala Road, Rajendra Nagar, Motihari</span>
                <a
                  href={settings.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-700 hover:text-amber-800 font-semibold"
                >
                  View larger map →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
