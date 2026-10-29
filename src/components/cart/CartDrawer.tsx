import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext.tsx';
import { useToast } from '../common/Toast.tsx';
import { FoodTypeBadge } from '../common/FoodTypeBadge.tsx';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  MessageSquare,
  ArrowRight,
  ArrowLeft,
  UtensilsCrossed,
  Phone,
  User,
  MapPin,
  Tag,
  Check,
  Percent,
  ShieldCheck,
  AlertCircle,
  Truck,
  RotateCcw,
  Building,
  Navigation,
  Clock,
} from 'lucide-react';
import { isRestaurantOpen, RESTAURANT_CLOSED_MESSAGE } from '../../utils/operatingHours.ts';

export function CartDrawer() {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    cartTotal,
    appliedOffer,
    applyOffer,
    removeOffer,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    coupons,
    cartDiscount,
    activeOffers,
    placeOrder,
    settings,
    openStatus,
    setIsClosedModalOpen,
  } = useRestaurant();
  const { showToast } = useToast();

  // Multi-step navigation: 'cart' | 'checkout' | 'submitted'
  const [step, setStep] = useState<'cart' | 'checkout' | 'submitted'>('cart');

  // Customer Delivery Information
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [houseFlat, setHouseFlat] = useState('');
  const [streetArea, setStreetArea] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState(settings.city || 'Motihari');
  const [pincode, setPincode] = useState(settings.pincode || '845401');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');

  // Validation errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Coupons
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [showOffersList, setShowOffersList] = useState(false);

  // Submission state & Result
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<any>(null);
  const [lastWhatsappUrl, setLastWhatsappUrl] = useState<string>('');

  if (!isCartOpen) return null;

  // Delivery charge calculation rule:
  // Order total (food subtotal) >= ₹400 => FREE DELIVERY (₹0)
  // Order total < ₹400 => ₹20
  const foodSubtotal = cartTotal;
  const deliveryCharge = foodSubtotal >= 400 ? 0 : 20;
  const finalPayableTotal = Math.max(0, cartDiscount.finalTotal + deliveryCharge);

  // Validate form fields
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

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Place Order handler
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    // Strict Operating Hours Enforcement
    if (!isRestaurantOpen()) {
      setIsClosedModalOpen(true);
      return;
    }

    if (cart.length === 0) {
      showToast('Your cart is empty', 'error');
      setStep('cart');
      return;
    }

    if (!validateForm()) {
      showToast('Please complete all required fields', 'error');
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
      setStep('submitted');

      showToast('Order details prepared! Opening WhatsApp to send to One Bite...', 'success');

      // Dispatch WhatsApp link safely without window.alert or window.open
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-title"
      className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
      onClick={e => {
        if (e.target === e.currentTarget) setIsCartOpen(false);
      }}
    >
      <div
        className="w-full max-w-lg bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-600 rounded-xl">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 id="cart-title" className="text-base font-bold text-white">
                {step === 'cart' && 'Your Order Cart'}
                {step === 'checkout' && 'Home Delivery Checkout'}
                {step === 'submitted' && 'Order Handoff to WhatsApp'}
              </h2>
              <span className="text-xs text-amber-400 font-medium">
                {step === 'cart' && `${cart.length} ${cart.length === 1 ? 'item' : 'items'}`}
                {step === 'checkout' && 'Pay on Delivery only (Cash or QR)'}
                {step === 'submitted' && `Order Ref: ${submittedOrder?.id || 'Processing'}`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {step === 'cart' && cart.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  clearCart();
                  showToast('Cart cleared', 'info');
                }}
                className="text-xs text-stone-400 hover:text-rose-400 p-1.5 transition-colors cursor-pointer"
                title="Clear all items"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
              aria-label="Close cart drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* STEP 1: REVIEW CART */}
        {step === 'cart' && (
          <>
            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                  <UtensilsCrossed className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-stone-900 mb-1">Your cart is empty</h3>
                <p className="text-xs sm:text-sm text-stone-500 max-w-xs mb-6">
                  Explore our authentic One Bite menu and add your favorite dishes to get started!
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsCartOpen(false);
                    const menuEl = document.getElementById('menu');
                    if (menuEl) {
                      menuEl.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 text-white font-bold text-xs sm:text-sm hover:bg-amber-700 transition-colors shadow-xs cursor-pointer"
                >
                  Browse Menu
                </button>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto divide-y divide-stone-100 p-4 space-y-4">
                {/* Cart Items List */}
                <div className="space-y-3">
                  {cart.map(item => {
                    const addonsCost = (item.addons || []).reduce((sum, a) => sum + a.price, 0);
                    const itemTotal = (item.unitPrice + addonsCost) * item.quantity;

                    return (
                      <div
                        key={item.id}
                        className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80 flex flex-col gap-2"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <span className="p-1 bg-white rounded-md shrink-0 shadow-2xs mt-0.5">
                              <FoodTypeBadge type={item.foodType} />
                            </span>
                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-stone-900 leading-snug line-clamp-1">
                                {item.name}
                              </h4>
                              {item.variant && (
                                <span className="inline-block text-[11px] font-semibold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-md mt-0.5">
                                  {item.variant.name}
                                </span>
                              )}
                              <div className="text-xs text-stone-500 mt-0.5">
                                Unit Price: <span className="font-semibold text-stone-800">₹{item.unitPrice}</span>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            className="text-stone-400 hover:text-rose-600 p-1 shrink-0 cursor-pointer"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Addons List */}
                        {item.addons && item.addons.length > 0 && (
                          <div className="text-[11px] text-stone-500 pl-6 space-y-0.5">
                            {item.addons.map(a => (
                              <div key={a.id} className="flex justify-between">
                                <span>+ {a.name}</span>
                                <span className="font-semibold text-stone-700">₹{a.price}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Quantity & Item Total Row */}
                        <div className="flex items-center justify-between pt-2 border-t border-stone-200/60 mt-1">
                          <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-lg px-2 py-0.5 shadow-2xs">
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(item.id, -1)}
                              className="p-1 text-stone-600 hover:text-stone-900 cursor-pointer"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-xs font-bold text-stone-900 w-5 text-center">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(item.id, 1)}
                              className="p-1 text-stone-600 hover:text-stone-900 cursor-pointer"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="text-sm font-extrabold text-stone-900">
                            Line Total: ₹{itemTotal}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Promo Code & Special Offers Box */}
                <div className="bg-amber-500/10 p-3.5 rounded-2xl border border-amber-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900">
                      <Tag className="w-3.5 h-3.5 text-amber-600" />
                      <span>Special Offer & Coupon</span>
                    </div>
                    {activeOffers.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowOffersList(!showOffersList)}
                        className="text-[11px] font-bold text-amber-700 hover:text-amber-800 cursor-pointer"
                      >
                        {showOffersList ? 'Hide Deals' : 'View Deals'}
                      </button>
                    )}
                  </div>

                  {appliedCoupon ? (
                    <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <div className="flex items-center gap-2">
                        <span className="p-1 bg-emerald-600 text-white rounded-md">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                        <div>
                          <span className="text-xs font-extrabold text-emerald-900 block font-mono">
                            COUPON: {appliedCoupon.code}
                          </span>
                          <span className="text-[11px] text-emerald-700 font-semibold block">
                            Saving ₹{cartDiscount.discountTotal} on your order
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          removeCoupon();
                          showToast('Coupon removed.', 'info');
                        }}
                        className="text-xs font-bold text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ) : appliedOffer ? (
                    <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <div className="flex items-center gap-2">
                        <span className="p-1 bg-emerald-600 text-white rounded-md">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                        <div>
                          <span className="text-xs font-bold text-emerald-900 block">
                            {appliedOffer.title} ({appliedOffer.discount})
                          </span>
                          <span className="text-[11px] text-emerald-700 font-semibold block">
                            Saving ₹{cartDiscount.discountTotal} on eligible items
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          removeOffer();
                          showToast('Offer removed.', 'info');
                        }}
                        className="text-xs font-bold text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter coupon code (e.g. ONEBITE20)"
                        value={couponCodeInput}
                        onChange={e => setCouponCodeInput(e.target.value.toUpperCase())}
                        className="flex-1 px-3 py-1.5 text-xs font-mono uppercase bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!couponCodeInput.trim()) {
                            showToast('Please enter a coupon code', 'error');
                            return;
                          }
                          const res = applyCoupon(couponCodeInput, customerPhone);
                          if (res.success) {
                            showToast(res.message, 'success');
                            setCouponCodeInput('');
                          } else {
                            showToast(res.message, 'error');
                          }
                        }}
                        className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>
                  )}

                  {/* Available Offers list dropdown */}
                  {showOffersList && !appliedOffer && activeOffers.length > 0 && (
                    <div className="pt-2 border-t border-amber-200/50 space-y-1.5">
                      <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                        Active Deals You Can Apply:
                      </span>
                      {activeOffers.map(offer => (
                        <div
                          key={offer.id}
                          className="p-2 bg-white rounded-xl border border-stone-200 flex items-center justify-between text-xs"
                        >
                          <div className="min-w-0 pr-2">
                            <span className="font-bold text-stone-900 block truncate">{offer.title}</span>
                            <span className="text-[11px] text-amber-700 font-semibold block">{offer.discount}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const res = applyOffer(offer);
                              if (res.success) {
                                showToast(res.message, 'success');
                                setShowOffersList(false);
                              } else {
                                showToast(res.message, 'error');
                              }
                            }}
                            className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 text-[11px] font-bold rounded-lg shrink-0 cursor-pointer"
                          >
                            Apply
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bill Summary */}
                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2 text-xs text-stone-600">
                  <div className="flex justify-between">
                    <span>Items Subtotal</span>
                    <span className="font-semibold text-stone-900">₹{cartTotal}</span>
                  </div>
                  {appliedOffer && cartDiscount.discountTotal > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span className="flex items-center gap-1">
                        <Percent className="w-3.5 h-3.5" />
                        <span>Special Offer Discount ({appliedOffer.title})</span>
                      </span>
                      <span>-₹{cartDiscount.discountTotal}</span>
                    </div>
                  )}
                  {/* Free delivery prompt banner */}
                  {foodSubtotal > 0 && foodSubtotal < 400 ? (
                    <div className="bg-amber-50/90 border border-amber-200/90 rounded-xl px-3 py-2 text-xs text-amber-900 font-medium flex items-center justify-between">
                      <span>Add <span className="font-bold text-amber-700">₹{(400 - foodSubtotal).toFixed(0)}</span> more for <span className="font-bold text-emerald-700">FREE DELIVERY</span></span>
                      <span className="text-[10px] font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-md shrink-0">Threshold ₹400</span>
                    </div>
                  ) : foodSubtotal >= 400 ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-xs text-emerald-900 font-medium flex items-center justify-between">
                      <span className="font-bold text-emerald-800">🎉 You unlocked FREE DELIVERY!</span>
                      <span className="text-[10px] font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-md shrink-0">₹0 Delivery Fee</span>
                    </div>
                  ) : null}

                  <div className="flex justify-between items-center">
                    <span>Delivery Charge</span>
                    <span className="font-semibold text-stone-900">
                      {deliveryCharge === 0 ? (
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full text-[11px] border border-emerald-200">FREE DELIVERY</span>
                      ) : (
                        `₹${deliveryCharge}`
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-stone-950 pt-2 border-t border-stone-200">
                    <span>Final Payable Total</span>
                    <span className="text-amber-700">₹{finalPayableTotal}</span>
                  </div>
                </div>

                {/* Action Buttons: PROCEED TO CHECKOUT & CONTINUE SHOPPING */}
                <div className="pt-2 space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!isRestaurantOpen()) {
                        setIsClosedModalOpen(true);
                        return;
                      }
                      setStep('checkout');
                    }}
                    className="w-full py-3.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>PROCEED TO CHECKOUT</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsCartOpen(false)}
                    className="w-full py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs transition-colors cursor-pointer"
                  >
                    CONTINUE SHOPPING
                  </button>

                  <p className="text-[11px] text-center text-stone-500 pt-1">
                    Pay on Delivery (Cash or QR Code) · No advance or online payment required
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* STEP 2: CHECKOUT & DELIVERY DETAILS */}
        {step === 'checkout' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
            {/* Navigation & Edit Cart Controls */}
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-stone-100">
              <button
                type="button"
                onClick={() => setStep('cart')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>EDIT CART ({cart.length} items)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="text-xs font-bold text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
              >
                CONTINUE SHOPPING
              </button>
            </div>

            <form onSubmit={handlePlaceOrder} className="space-y-4">
              {/* Customer Information */}
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-600" />
                  <span>Customer Contact Details</span>
                </h3>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
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
                        if (fieldErrors.customerName) {
                          setFieldErrors(prev => ({ ...prev, customerName: '' }));
                        }
                      }}
                      className={`w-full pl-9 pr-3 py-2 text-xs border rounded-xl focus:outline-none focus:ring-1 ${
                        fieldErrors.customerName
                          ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/30'
                          : 'border-stone-200 focus:ring-amber-500'
                      }`}
                    />
                  </div>
                  {fieldErrors.customerName && (
                    <span className="text-[11px] text-rose-600 mt-1 block font-medium">
                      {fieldErrors.customerName}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
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
                        if (fieldErrors.customerPhone) {
                          setFieldErrors(prev => ({ ...prev, customerPhone: '' }));
                        }
                      }}
                      className={`w-full pl-9 pr-3 py-2 text-xs border rounded-xl focus:outline-none focus:ring-1 ${
                        fieldErrors.customerPhone
                          ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/30'
                          : 'border-stone-200 focus:ring-amber-500'
                      }`}
                    />
                  </div>
                  {fieldErrors.customerPhone && (
                    <span className="text-[11px] text-rose-600 mt-1 block font-medium">
                      {fieldErrors.customerPhone}
                    </span>
                  )}
                </div>
              </div>

              {/* Delivery Address Information */}
              <div className="space-y-3 pt-2 border-t border-stone-200">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  <span>Home Delivery Address (Motihari)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
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
                          if (fieldErrors.houseFlat) {
                            setFieldErrors(prev => ({ ...prev, houseFlat: '' }));
                          }
                        }}
                        className={`w-full pl-9 pr-3 py-2 text-xs border rounded-xl focus:outline-none focus:ring-1 ${
                          fieldErrors.houseFlat
                            ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/30'
                            : 'border-stone-200 focus:ring-amber-500'
                        }`}
                      />
                    </div>
                    {fieldErrors.houseFlat && (
                      <span className="text-[11px] text-rose-600 mt-1 block font-medium">
                        {fieldErrors.houseFlat}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
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
                          if (fieldErrors.streetArea) {
                            setFieldErrors(prev => ({ ...prev, streetArea: '' }));
                          }
                        }}
                        className={`w-full pl-9 pr-3 py-2 text-xs border rounded-xl focus:outline-none focus:ring-1 ${
                          fieldErrors.streetArea
                            ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/30'
                            : 'border-stone-200 focus:ring-amber-500'
                        }`}
                      />
                    </div>
                    {fieldErrors.streetArea && (
                      <span className="text-[11px] text-rose-600 mt-1 block font-medium">
                        {fieldErrors.streetArea}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                      Landmark (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Nearby landmark"
                      value={landmark}
                      onChange={e => setLandmark(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                      City <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={e => {
                        setCity(e.target.value);
                        if (fieldErrors.city) {
                          setFieldErrors(prev => ({ ...prev, city: '' }));
                        }
                      }}
                      className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 bg-stone-50"
                    />
                    {fieldErrors.city && (
                      <span className="text-[11px] text-rose-600 mt-1 block font-medium">
                        {fieldErrors.city}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
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
                        if (fieldErrors.pincode) {
                          setFieldErrors(prev => ({ ...prev, pincode: '' }));
                        }
                      }}
                      className={`w-full px-3 py-2 text-xs border rounded-xl focus:outline-none focus:ring-1 ${
                        fieldErrors.pincode
                          ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/30'
                          : 'border-stone-200 focus:ring-amber-500'
                      }`}
                    />
                    {fieldErrors.pincode && (
                      <span className="text-[11px] text-rose-600 mt-1 block font-medium">
                        {fieldErrors.pincode}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Delivery Instructions (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Special delivery notes or directions"
                    value={deliveryInstructions}
                    onChange={e => setDeliveryInstructions(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* PAYMENT SYSTEM: PAY ON DELIVERY ONLY */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-300/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-700" />
                    <span className="text-xs font-extrabold uppercase tracking-wider text-amber-900">
                      Payment System — Pay on Delivery (POD) Only
                    </span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-200/80 text-amber-900">
                    Selected
                  </span>
                </div>

                <p className="text-xs text-amber-950 font-medium leading-relaxed">
                  Pay when your food arrives at your home. You can pay in cash or scan the delivery boy's QR code at the time of delivery. No advance or online payment is required.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                  <div className="p-2 bg-white rounded-xl border border-amber-200 font-semibold text-stone-800">
                    <span className="text-[10px] uppercase text-stone-500 block">Initial Status</span>
                    UNPAID — PAYMENT ON DELIVERY
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-amber-200 font-semibold text-stone-800">
                    <span className="text-[10px] uppercase text-stone-500 block">Payment Options</span>
                    Cash or Delivery Boy's QR Scanner
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-amber-200 font-semibold text-emerald-800">
                    <span className="text-[10px] uppercase text-stone-500 block">Advance Payment</span>
                    NOT REQUIRED
                  </div>
                </div>
              </div>

              {/* Order Bill Summary */}
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-1.5 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-stone-900">₹{cartTotal}</span>
                </div>
                {appliedOffer && cartDiscount.discountTotal > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Discount ({appliedOffer.title})</span>
                    <span>-₹{cartDiscount.discountTotal}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span>Delivery Charge</span>
                  <span className="font-semibold text-stone-900">
                    {deliveryCharge === 0 ? (
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full text-[11px] border border-emerald-200">FREE DELIVERY</span>
                    ) : (
                      `₹${deliveryCharge}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-stone-950 pt-2 border-t border-stone-200">
                  <span>FINAL TOTAL</span>
                  <span className="text-amber-700">₹{finalPayableTotal}</span>
                </div>
              </div>

              {/* Guidance message before submission */}
              <div className="p-3 bg-stone-100 rounded-xl text-stone-700 text-xs text-center">
                Review your order and delivery details before continuing to WhatsApp.
              </div>

              {/* Operating hours status notice if closed */}
              {!openStatus.isOpen && (
                <div
                  onClick={() => setIsClosedModalOpen(true)}
                  className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 cursor-pointer hover:bg-rose-100 transition-colors"
                >
                  <Clock className="w-4 h-4 text-rose-600 shrink-0 mt-0.5 animate-pulse" />
                  <div className="text-left space-y-0.5">
                    <div className="text-xs font-bold text-rose-900">CLOSED — Orders Unavailable</div>
                    <p className="text-[11px] text-rose-700 leading-relaxed font-medium">
                      One Bite is currently closed. Operating hours: 11:00 AM to 8:45 PM IST.
                    </p>
                  </div>
                </div>
              )}

              {/* PLACE DELIVERY ORDER BUTTON */}
              <div className="space-y-1.5 pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting || !openStatus.isOpen}
                  className="w-full py-4 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 disabled:bg-stone-300 disabled:text-stone-500 disabled:cursor-not-allowed text-white font-extrabold text-sm sm:text-base shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? 'Preparing WhatsApp Order...'
                      : !openStatus.isOpen
                      ? 'CLOSED — Orders Unavailable'
                      : 'PLACE DELIVERY ORDER'}
                  </span>
                </button>
                <p className="text-[11px] text-center text-stone-600 font-semibold">
                  Payment due on delivery. No advance payment required.
                </p>
              </div>
            </form>
          </div>
        )}

        {/* STEP 3: SUBMITTED / WHATSAPP HANDOFF STATUS */}
        {step === 'submitted' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mx-auto">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-emerald-950">
                WhatsApp Order Details Generated
              </h3>
              <p className="text-xs text-emerald-800 font-medium">
                WhatsApp has opened with your order details. Press Send to submit your order to ONE BITE.
              </p>
            </div>

            {/* Waiting for Confirmation Callout */}
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Important Order Status Note</span>
              </div>
              <p className="text-xs text-amber-950 leading-relaxed font-medium">
                If you have sent the message, please wait for the restaurant to confirm your order. Opening WhatsApp alone does not submit the order.
              </p>
              <p className="text-xs text-stone-600 leading-relaxed">
                Your order will be confirmed by ONE BITE once our team reviews kitchen availability. Please keep your phone available for delivery updates.
              </p>
            </div>

            {/* Order Reference Details Card */}
            {submittedOrder && (
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2.5 text-xs text-stone-700">
                <div className="flex justify-between items-center pb-2 border-b border-stone-200">
                  <span className="font-bold text-stone-900">Order Reference</span>
                  <span className="font-mono font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
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
                  <span className="font-semibold text-stone-900 text-right max-w-[200px] truncate">
                    {houseFlat}, {streetArea}, Motihari
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <span className="font-bold text-amber-800">Pay on Delivery (UNPAID)</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-stone-200 text-sm font-extrabold text-stone-950">
                  <span>Payable at Doorstep:</span>
                  <span className="text-amber-700">₹{finalPayableTotal}</span>
                </div>
              </div>
            )}

            {/* Note on cart retention */}
            <p className="text-[11px] text-stone-500 text-center leading-normal">
              Notice: Your cart items have been kept intact in case you need to review them. You may return to the menu or clear your cart when convenient.
            </p>

            {/* Next Action Buttons */}
            <div className="space-y-2 pt-2">
              {lastWhatsappUrl && (
                <a
                  href={lastWhatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Open WhatsApp Again</span>
                </a>
              )}

              {settings.phone && (
                <a
                  href={`tel:${settings.phone}`}
                  className="w-full py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call One Bite Motihari ({settings.phone})</span>
                </a>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    clearCart();
                    setStep('cart');
                    setIsCartOpen(false);
                    showToast('Cart cleared. Order recorded for One Bite.', 'info');
                  }}
                  className="flex-1 py-2 px-3 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 font-semibold text-xs transition-colors cursor-pointer"
                >
                  I Sent Order — Clear Cart
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsCartOpen(false);
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  Keep Cart & Return
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
