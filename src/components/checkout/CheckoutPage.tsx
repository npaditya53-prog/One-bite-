import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext.tsx';
import { useToast } from '../common/Toast.tsx';
import { FoodTypeBadge } from '../common/FoodTypeBadge.tsx';
import {
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  UtensilsCrossed,
  User,
  Phone,
  MapPin,
  Building,
  Navigation,
  ShieldCheck,
  CheckSquare,
  Square,
  MessageSquare,
  AlertCircle,
  Plus,
  Minus,
  Trash2,
  Clock,
} from 'lucide-react';
import { isRestaurantOpen, RESTAURANT_CLOSED_MESSAGE } from '../../utils/operatingHours.ts';

interface CheckoutPageProps {
  onNavigate: (view: string) => void;
}

export function CheckoutPage({ onNavigate }: CheckoutPageProps) {
  const {
    cart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    cartTotal,
    cartDiscount,
    appliedOffer,
    placeOrder,
    settings,
    firebaseUser,
    loginWithGoogle,
    openStatus,
    setIsClosedModalOpen,
  } = useRestaurant();
  const { showToast } = useToast();

  const [customerName, setCustomerName] = useState(() => firebaseUser?.displayName || '');
  const [customerPhone, setCustomerPhone] = useState('');
  const [houseFlat, setHouseFlat] = useState('');
  const [streetArea, setStreetArea] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState(settings.city || 'Motihari');
  const [pincode, setPincode] = useState(settings.pincode || '845401');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');

  React.useEffect(() => {
    if (firebaseUser?.displayName && !customerName) {
      setCustomerName(firebaseUser.displayName);
    }
  }, [firebaseUser]);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [checklist, setChecklist] = useState({
    itemsChecked: false,
    pricesChecked: false,
    contactChecked: false,
    addressChecked: false,
    podUnderstood: false,
    whatsappUnderstood: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<any>(null);
  const [lastWhatsappUrl, setLastWhatsappUrl] = useState<string>('');

  const configuredDeliveryFee = settings.deliveryCharge ?? 0;
  const freeThreshold = settings.freeDeliveryThreshold ?? 0;
  const deliveryCharge =
    configuredDeliveryFee > 0
      ? freeThreshold > 0 && cartTotal >= freeThreshold
        ? 0
        : configuredDeliveryFee
      : 0;

  const finalPayableTotal = Math.max(0, cartDiscount.finalTotal + deliveryCharge);

  const toggleChecklist = (key: keyof typeof checklist) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const checkAllChecklist = () => {
    setChecklist({
      itemsChecked: true,
      pricesChecked: true,
      contactChecked: true,
      addressChecked: true,
      podUnderstood: true,
      whatsappUnderstood: true,
    });
  };

  const isChecklistComplete =
    checklist.itemsChecked &&
    checklist.pricesChecked &&
    checklist.contactChecked &&
    checklist.addressChecked &&
    checklist.podUnderstood &&
    checklist.whatsappUnderstood;

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!customerName.trim()) {
      errors.customerName = 'Full Name is required';
    } else if (customerName.trim().length < 2) {
      errors.customerName = 'Please enter a valid name';
    }

    const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
    if (!cleanPhone) {
      errors.customerPhone = 'Mobile number is required';
    } else if (cleanPhone.length !== 10) {
      errors.customerPhone = 'Enter a valid 10-digit mobile number';
    }

    if (!houseFlat.trim()) {
      errors.houseFlat = 'House / Flat / Shop Number is required';
    }

    if (!streetArea.trim()) {
      errors.streetArea = 'Street / Area / Locality is required';
    }

    if (!city.trim()) {
      errors.city = 'City is required';
    }

    const cleanPin = pincode.replace(/[^0-9]/g, '');
    if (!cleanPin) {
      errors.pincode = 'PIN Code is required';
    } else if (cleanPin.length !== 6) {
      errors.pincode = 'Enter a valid 6-digit PIN code';
    }

    if (!isChecklistComplete) {
      errors.checklist = 'Please confirm all checklist items before proceeding';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    // Strict Operating Hours Enforcement
    if (!isRestaurantOpen()) {
      setIsClosedModalOpen(true);
      return;
    }

    if (cart.length === 0) {
      showToast('Your cart is empty', 'error');
      onNavigate('menu');
      return;
    }

    if (!validateForm()) {
      showToast('Please complete all required fields and checklist confirmations', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
      const compositeAddress = [
        `House/Flat: ${houseFlat.trim()}`,
        streetArea.trim(),
        landmark.trim() ? `Landmark: ${landmark.trim()}` : '',
        city.trim() || 'Motihari',
        `PIN: ${pincode.trim()}`,
      ]
        .filter(Boolean)
        .join(', ');

      const res = await placeOrder({
        customerName: customerName.trim(),
        customerPhone: cleanPhone,
        orderType: 'delivery',
        houseFlat: houseFlat.trim(),
        streetArea: streetArea.trim(),
        landmark: landmark.trim(),
        city: city.trim() || 'Motihari',
        pincode: pincode.trim() || '845401',
        deliveryInstructions: deliveryInstructions.trim(),
        deliveryAddress: compositeAddress,
      });

      setSubmittedOrder(res.order);
      setLastWhatsappUrl(res.whatsappUrl);

      showToast('Order details prepared! Opening WhatsApp to send to One Bite...', 'success');

      const link = document.createElement('a');
      link.href = res.whatsappUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      showToast(err?.message || 'Failed to place order', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0 && !submittedOrder) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
          <UtensilsCrossed className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-stone-900 mb-2">Your Cart is Empty</h2>
        <p className="text-sm text-stone-600 max-w-sm mb-6">
          Add fresh burgers, pizzas, wraps, chicken buckets, and shakes from the One Bite Motihari menu before proceeding to checkout.
        </p>
        <button
          onClick={() => onNavigate('menu')}
          className="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-sm transition-colors cursor-pointer"
        >
          Explore Full Menu
        </button>
      </div>
    );
  }

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Breadcrumb / Back button */}
      <div className="mb-6">
        <button
          onClick={() => onNavigate('menu')}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Menu & Browse Dishes</span>
        </button>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
          Home Delivery Checkout
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 mt-1">
          One Bite – A Family Restaurant, Motihari · Pay on Delivery Only (Cash or QR Scanner)
        </p>
      </div>

      {submittedOrder ? (
        /* Submitted WhatsApp stage */
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6">
          <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-center space-y-2">
            <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mx-auto">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-emerald-950">
              WhatsApp Order Details Generated
            </h3>
            <p className="text-xs sm:text-sm text-emerald-800 font-medium">
              WhatsApp has opened with your order details. Press Send to submit your order to ONE BITE.
            </p>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Important Order Status Note</span>
            </div>
            <p className="text-xs sm:text-sm text-amber-950 leading-relaxed font-medium">
              If you have sent the message, please wait for the restaurant to confirm your order. Opening WhatsApp alone does not submit the order.
            </p>
            <p className="text-xs text-stone-600 leading-relaxed">
              Your order will be confirmed by ONE BITE once our team reviews kitchen availability. Please keep your phone available for delivery updates.
            </p>
          </div>

          <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200 space-y-3 text-xs sm:text-sm text-stone-700">
            <div className="flex justify-between items-center pb-2 border-b border-stone-200">
              <span className="font-bold text-stone-900">Order Reference</span>
              <span className="font-mono font-extrabold text-amber-800 bg-amber-100 px-3 py-1 rounded-lg">
                {submittedOrder.id}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Customer Name:</span>
              <span className="font-semibold text-stone-900">{customerName}</span>
            </div>
            <div className="flex justify-between">
              <span>Mobile:</span>
              <span className="font-semibold text-stone-900">{customerPhone}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Address:</span>
              <span className="font-semibold text-stone-900 text-right">
                {houseFlat}, {streetArea}, Motihari (PIN: {pincode})
              </span>
            </div>
            <div className="flex justify-between">
              <span>Payment Method:</span>
              <span className="font-bold text-amber-800">Pay on Delivery (UNPAID)</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-stone-200 text-base font-extrabold text-stone-950">
              <span>Payable at Doorstep:</span>
              <span className="text-amber-700">₹{finalPayableTotal}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            {lastWhatsappUrl && (
              <a
                href={lastWhatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Open WhatsApp Again</span>
              </a>
            )}

            {settings.phone && (
              <a
                href={`tel:${settings.phone}`}
                className="py-3 px-5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span>Call ({settings.phone})</span>
              </a>
            )}

            <button
              type="button"
              onClick={() => {
                clearCart();
                onNavigate('menu');
                showToast('Cart cleared. Order recorded for One Bite.', 'info');
              }}
              className="py-3 px-5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
            >
              I Sent Order — Clear Cart
            </button>
          </div>
        </div>
      ) : (
        /* 2-Column Checkout Layout */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form & Checklist */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6">
            <form onSubmit={handlePlaceOrder} className="space-y-6">
              {/* Customer Contact */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-stone-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-amber-600" />
                    <span>1. Customer Details</span>
                  </h3>
                </div>

                {/* Google Sign-in Sync Status */}
                {firebaseUser ? (
                  <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200/80 flex items-center gap-2.5 text-xs text-stone-700">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="leading-snug">
                      Signed in as <strong className="text-stone-900">{firebaseUser.displayName || 'Customer'}</strong> ({firebaseUser.email}). Your order will be automatically linked to your account for live tracking.
                    </span>
                  </div>
                ) : (
                  <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <span className="text-stone-600">
                      Want real-time order tracking across all your devices?
                    </span>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await loginWithGoogle();
                          showToast('Signed in with Google! Details linked.', 'success');
                        } catch (err: any) {
                          showToast(err?.message || 'Google sign-in was cancelled or failed.', 'error');
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-stone-100 text-stone-800 font-bold border border-stone-300 shadow-2xs self-start sm:self-auto cursor-pointer transition-colors"
                    >
                      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                      </svg>
                      <span>Sign in with Google (Optional)</span>
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <input
                        type="text"
                        required
                        placeholder="Full name"
                        value={customerName}
                        onChange={e => {
                          setCustomerName(e.target.value);
                          if (fieldErrors.customerName) setFieldErrors(prev => ({ ...prev, customerName: '' }));
                        }}
                        className={`w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm border rounded-xl focus:outline-none focus:ring-1 ${
                          fieldErrors.customerName ? 'border-rose-400 bg-rose-50/30' : 'border-stone-200 focus:ring-amber-500'
                        }`}
                      />
                    </div>
                    {fieldErrors.customerName && (
                      <span className="text-xs text-rose-600 mt-1 block font-medium">
                        {fieldErrors.customerName}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                      Mobile Number (WhatsApp) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <input
                        type="tel"
                        required
                        placeholder="10-digit mobile number"
                        value={customerPhone}
                        onChange={e => {
                          setCustomerPhone(e.target.value);
                          if (fieldErrors.customerPhone) setFieldErrors(prev => ({ ...prev, customerPhone: '' }));
                        }}
                        className={`w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm border rounded-xl focus:outline-none focus:ring-1 ${
                          fieldErrors.customerPhone ? 'border-rose-400 bg-rose-50/30' : 'border-stone-200 focus:ring-amber-500'
                        }`}
                      />
                    </div>
                    {fieldErrors.customerPhone && (
                      <span className="text-xs text-rose-600 mt-1 block font-medium">
                        {fieldErrors.customerPhone}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="space-y-4 pt-4 border-t border-stone-200">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-stone-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-600" />
                  <span>2. Home Delivery Address (Motihari)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                      House / Flat / Shop No. <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <input
                        type="text"
                        required
                        placeholder="House number, flat, or shop"
                        value={houseFlat}
                        onChange={e => {
                          setHouseFlat(e.target.value);
                          if (fieldErrors.houseFlat) setFieldErrors(prev => ({ ...prev, houseFlat: '' }));
                        }}
                        className={`w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm border rounded-xl focus:outline-none focus:ring-1 ${
                          fieldErrors.houseFlat ? 'border-rose-400 bg-rose-50/30' : 'border-stone-200 focus:ring-amber-500'
                        }`}
                      />
                    </div>
                    {fieldErrors.houseFlat && (
                      <span className="text-xs text-rose-600 mt-1 block font-medium">
                        {fieldErrors.houseFlat}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                      Street / Area / Locality <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <input
                        type="text"
                        required
                        placeholder="Street, road, or area locality"
                        value={streetArea}
                        onChange={e => {
                          setStreetArea(e.target.value);
                          if (fieldErrors.streetArea) setFieldErrors(prev => ({ ...prev, streetArea: '' }));
                        }}
                        className={`w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm border rounded-xl focus:outline-none focus:ring-1 ${
                          fieldErrors.streetArea ? 'border-rose-400 bg-rose-50/30' : 'border-stone-200 focus:ring-amber-500'
                        }`}
                      />
                    </div>
                    {fieldErrors.streetArea && (
                      <span className="text-xs text-rose-600 mt-1 block font-medium">
                        {fieldErrors.streetArea}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                      Landmark (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Nearby landmark"
                      value={landmark}
                      onChange={e => setLandmark(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                      City <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 bg-stone-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                      PIN Code <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="6-digit PIN code"
                      value={pincode}
                      onChange={e => {
                        setPincode(e.target.value);
                        if (fieldErrors.pincode) setFieldErrors(prev => ({ ...prev, pincode: '' }));
                      }}
                      className={`w-full px-3.5 py-2.5 text-xs sm:text-sm border rounded-xl focus:outline-none focus:ring-1 ${
                        fieldErrors.pincode ? 'border-rose-400 bg-rose-50/30' : 'border-stone-200 focus:ring-amber-500'
                      }`}
                    />
                    {fieldErrors.pincode && (
                      <span className="text-xs text-rose-600 mt-1 block font-medium">
                        {fieldErrors.pincode}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Delivery Instructions (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Special delivery notes or directions"
                    value={deliveryInstructions}
                    onChange={e => setDeliveryInstructions(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* PAYMENT SYSTEM: PAY ON DELIVERY ONLY */}
              <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-300 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-amber-700" />
                    <span className="text-sm font-extrabold uppercase tracking-wider text-amber-900">
                      Payment System — Pay on Delivery (POD) Only
                    </span>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-amber-200/80 text-amber-900">
                    Selected
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-amber-950 font-medium leading-relaxed">
                  Pay only when your food is delivered to your home. You can pay the delivery person in cash or scan their QR code when they arrive. No online payment or advance payment is required while placing your order.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                  <div className="p-2.5 bg-white rounded-xl border border-amber-200 font-semibold text-stone-800">
                    <span className="text-[10px] uppercase text-stone-500 block">Initial Status</span>
                    UNPAID — PAYMENT ON DELIVERY
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-amber-200 font-semibold text-stone-800">
                    <span className="text-[10px] uppercase text-stone-500 block">Payment Options</span>
                    Cash or Delivery Boy's QR Scanner
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-amber-200 font-semibold text-emerald-800">
                    <span className="text-[10px] uppercase text-stone-500 block">Advance Payment</span>
                    NOT REQUIRED
                  </div>
                </div>
              </div>

              {/* Order Review Checklist */}
              <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-stone-900">
                    Order Review Checklist
                  </h4>
                  <button
                    type="button"
                    onClick={checkAllChecklist}
                    className="text-xs font-bold text-amber-700 hover:text-amber-800 cursor-pointer"
                  >
                    Select All
                  </button>
                </div>

                <div className="space-y-2.5 text-xs sm:text-sm text-stone-700">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <button
                      type="button"
                      onClick={() => toggleChecklist('itemsChecked')}
                      className="mt-0.5 text-stone-700 shrink-0 cursor-pointer"
                      aria-label="Confirm food items and quantities"
                    >
                      {checklist.itemsChecked ? (
                        <CheckSquare className="w-4 h-4 text-amber-600" />
                      ) : (
                        <Square className="w-4 h-4 text-stone-400" />
                      )}
                    </button>
                    <span>I have checked the food items and their quantities.</span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <button
                      type="button"
                      onClick={() => toggleChecklist('pricesChecked')}
                      className="mt-0.5 text-stone-700 shrink-0 cursor-pointer"
                      aria-label="Confirm food prices and final total"
                    >
                      {checklist.pricesChecked ? (
                        <CheckSquare className="w-4 h-4 text-amber-600" />
                      ) : (
                        <Square className="w-4 h-4 text-stone-400" />
                      )}
                    </button>
                    <span>I have checked the food prices and final total (₹{finalPayableTotal}).</span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <button
                      type="button"
                      onClick={() => toggleChecklist('contactChecked')}
                      className="mt-0.5 text-stone-700 shrink-0 cursor-pointer"
                      aria-label="Confirm name and mobile number"
                    >
                      {checklist.contactChecked ? (
                        <CheckSquare className="w-4 h-4 text-amber-600" />
                      ) : (
                        <Square className="w-4 h-4 text-stone-400" />
                      )}
                    </button>
                    <span>My name and mobile number are correct.</span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <button
                      type="button"
                      onClick={() => toggleChecklist('addressChecked')}
                      className="mt-0.5 text-stone-700 shrink-0 cursor-pointer"
                      aria-label="Confirm delivery address"
                    >
                      {checklist.addressChecked ? (
                        <CheckSquare className="w-4 h-4 text-amber-600" />
                      ) : (
                        <Square className="w-4 h-4 text-stone-400" />
                      )}
                    </button>
                    <span>My complete home delivery address and PIN code are correct.</span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <button
                      type="button"
                      onClick={() => toggleChecklist('podUnderstood')}
                      className="mt-0.5 text-stone-700 shrink-0 cursor-pointer"
                      aria-label="Confirm payment on delivery"
                    >
                      {checklist.podUnderstood ? (
                        <CheckSquare className="w-4 h-4 text-amber-600" />
                      ) : (
                        <Square className="w-4 h-4 text-stone-400" />
                      )}
                    </button>
                    <span>I understand that payment will be made only when the delivery boy arrives.</span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <button
                      type="button"
                      onClick={() => toggleChecklist('whatsappUnderstood')}
                      className="mt-0.5 text-stone-700 shrink-0 cursor-pointer"
                      aria-label="Confirm WhatsApp transmission"
                    >
                      {checklist.whatsappUnderstood ? (
                        <CheckSquare className="w-4 h-4 text-amber-600" />
                      ) : (
                        <Square className="w-4 h-4 text-stone-400" />
                      )}
                    </button>
                    <span>I understand that I must send the order through WhatsApp and wait for restaurant confirmation.</span>
                  </label>
                </div>

                {fieldErrors.checklist && (
                  <div className="flex items-center gap-1.5 text-rose-600 text-xs font-semibold pt-1">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{fieldErrors.checklist}</span>
                  </div>
                )}
              </div>

              {/* Stage guidance */}
              <div className="p-3.5 bg-stone-100 rounded-xl text-stone-700 text-xs text-center font-medium">
                Review your order and delivery details before continuing to WhatsApp.
              </div>

              {/* Operating Hours Closed Notice if outside 11:00 AM - 8:45 PM IST */}
              {!openStatus.isOpen && (
                <div
                  onClick={() => setIsClosedModalOpen(true)}
                  className="p-4 bg-rose-50 border border-rose-300 rounded-2xl flex items-start gap-3 cursor-pointer hover:bg-rose-100 transition-colors"
                >
                  <Clock className="w-5 h-5 text-rose-600 shrink-0 mt-0.5 animate-pulse" />
                  <div className="text-left space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black px-2 py-0.5 rounded-full bg-rose-600 text-white uppercase tracking-wide">
                        Closed
                      </span>
                      <span className="text-xs font-bold text-rose-900">CLOSED — Orders Unavailable</span>
                    </div>
                    <p className="text-xs text-rose-800 leading-relaxed font-medium">
                      We’re sorry! One Bite is currently closed and cannot accept your order right now. Operating hours are 11:00 AM to 8:45 PM IST.
                    </p>
                    <span className="text-[11px] text-rose-600 underline font-semibold block pt-0.5">
                      Click to view operating hours & details
                    </span>
                  </div>
                </div>
              )}

              {/* PLACE DELIVERY ORDER BUTTON */}
              <div className="space-y-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !isChecklistComplete || !openStatus.isOpen}
                  className="w-full py-4 px-6 rounded-2xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 disabled:bg-stone-300 disabled:text-stone-500 disabled:cursor-not-allowed text-white font-extrabold text-base shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageSquare className="w-5 h-5" />
                  <span>
                    {isSubmitting
                      ? 'Preparing WhatsApp Order...'
                      : !openStatus.isOpen
                      ? 'CLOSED — Orders Unavailable'
                      : 'PLACE DELIVERY ORDER'}
                  </span>
                </button>
                <p className="text-xs text-center text-stone-600 font-semibold">
                  Payment due on delivery. No advance payment required.
                </p>
              </div>
            </form>
          </div>

          {/* Right Column: Order Summary Items & Pricing */}
          <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-5 sticky top-24">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-stone-900 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-amber-600" />
                <span>Order Items ({cart.length})</span>
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('menu')}
                className="text-xs font-bold text-amber-700 hover:text-amber-800 cursor-pointer"
              >
                + Add Dishes
              </button>
            </div>

            {/* Items list */}
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {cart.map(item => {
                const addonsCost = (item.addons || []).reduce((sum, a) => sum + a.price, 0);
                const itemTotal = (item.unitPrice + addonsCost) * item.quantity;

                return (
                  <div
                    key={item.id}
                    className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <FoodTypeBadge type={item.foodType} />
                        <span className="font-bold text-stone-900 truncate">{item.name}</span>
                      </div>
                      {item.variant && (
                        <span className="text-[11px] text-amber-800 font-medium block">
                          Size: {item.variant.name}
                        </span>
                      )}
                      <div className="text-stone-500 text-[11px]">
                        ₹{item.unitPrice} × {item.quantity}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-white border border-stone-200 rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.id, -1)}
                          className="p-0.5 text-stone-600 hover:text-stone-950"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-4 text-center text-xs font-bold">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.id, 1)}
                          className="p-0.5 text-stone-600 hover:text-stone-950"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="font-extrabold text-stone-900 w-12 text-right">
                        ₹{itemTotal}
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="text-stone-400 hover:text-rose-600 p-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bill Summary */}
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2 text-xs text-stone-600">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-semibold text-stone-900">₹{cartTotal}</span>
              </div>
              {appliedOffer && cartDiscount.discountTotal > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Special Discount ({appliedOffer.title})</span>
                  <span>-₹{cartDiscount.discountTotal}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery Charge</span>
                <span className="font-semibold text-stone-900">
                  {deliveryCharge === 0 ? (
                    <span className="text-emerald-700 font-bold">FREE in Motihari</span>
                  ) : (
                    `₹${deliveryCharge}`
                  )}
                </span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-stone-950 pt-2 border-t border-stone-200">
                <span>Final Payable Total</span>
                <span className="text-amber-700">₹{finalPayableTotal}</span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 space-y-1">
              <span className="font-bold block">Verified Store Contact:</span>
              <span>{settings.address}, Motihari · Phone: {settings.phone || '+91 82104 42538'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
