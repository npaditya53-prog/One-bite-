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
  UtensilsCrossed,
  Phone,
  User,
  MapPin,
  Tag,
  Sparkles,
  Check,
  Percent,
} from 'lucide-react';

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
    cartDiscount,
    activeOffers,
    placeOrder,
    settings,
  } = useRestaurant();
  const { showToast } = useToast();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderType, setOrderType] = useState<'takeaway' | 'delivery' | 'dine_in'>('takeaway');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOffersList, setShowOffersList] = useState(false);

  if (!isCartOpen) return null;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      showToast('Please enter your name', 'error');
      return;
    }

    const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      showToast('Please enter a valid 10-digit phone number', 'error');
      return;
    }

    if (orderType === 'delivery' && !deliveryAddress.trim()) {
      showToast('Please enter your delivery address in Motihari', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await placeOrder({
        customerName: customerName.trim(),
        customerPhone: cleanPhone,
        orderType,
        deliveryAddress: deliveryAddress.trim(),
        tableNumber: tableNumber.trim(),
        notes: notes.trim(),
      });

      showToast('Order submitted successfully! Opening WhatsApp to connect with the restaurant...', 'success');

      // Dispatch WhatsApp link safely without window.open
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
      className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
      onClick={e => {
        if (e.target === e.currentTarget) setIsCartOpen(false);
      }}
    >
      <div
        className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-600 rounded-xl">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Your Order Cart</h2>
              <span className="text-xs text-amber-400 font-medium">
                {cart.length} {cart.length === 1 ? 'item' : 'items'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <button
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
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Body */}
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
              onClick={() => setIsCartOpen(false)}
              className="px-5 py-2.5 rounded-xl bg-amber-600 text-white font-bold text-xs sm:text-sm hover:bg-amber-700 transition-colors shadow-xs"
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
                    className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 flex flex-col gap-2"
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
                        </div>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-stone-400 hover:text-rose-600 p-1 shrink-0"
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
                          onClick={() => updateCartQuantity(item.id, -1)}
                          className="p-0.5 text-stone-600 hover:text-stone-900"
                          aria-label="Decrease"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-bold text-stone-900 w-4 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQuantity(item.id, 1)}
                          className="p-0.5 text-stone-600 hover:text-stone-900"
                          aria-label="Increase"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-sm font-extrabold text-stone-900">
                        ₹{itemTotal}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Customer Details Form */}
            <form onSubmit={handleCheckout} className="pt-4 space-y-3.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                Delivery & Order Details
              </h3>

              {/* Order Type Tabs */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-stone-100 rounded-xl">
                {(['takeaway', 'delivery', 'dine_in'] as const).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setOrderType(type)}
                    className={`py-1.5 px-2 text-xs font-bold rounded-lg capitalize transition-all ${
                      orderType === type
                        ? 'bg-stone-900 text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {type === 'dine_in' ? 'Dine-In' : type}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Your Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Contact Phone (WhatsApp) *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {orderType === 'delivery' && (
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Delivery Address in Motihari *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
                    <textarea
                      rows={2}
                      required
                      placeholder="House/Shop no, Landmark, Locality in Motihari..."
                      value={deliveryAddress}
                      onChange={e => setDeliveryAddress(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
              )}

              {orderType === 'dine_in' && (
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Table Number (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Table 4"
                    value={tableNumber}
                    onChange={e => setTableNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Cooking Notes / Special Instructions
                </label>
                <input
                  type="text"
                  placeholder="e.g. Extra spicy, less mayo, etc."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
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
                      className="text-[11px] font-bold text-amber-700 hover:text-amber-800"
                    >
                      {showOffersList ? 'Hide Deals' : 'View Deals'}
                    </button>
                  )}
                </div>

                {appliedOffer ? (
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
                      className="text-xs font-bold text-rose-600 hover:text-rose-800 p-1"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter promo code (e.g. ONEBITE20)"
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
                        const res = applyOffer(couponCodeInput);
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
                          className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 text-[11px] font-bold rounded-lg shrink-0"
                        >
                          Apply
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Order Bill Summary */}
              <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 space-y-1.5 text-xs text-stone-600">
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
                <div className="flex justify-between">
                  <span>Store Taxes & Packaging</span>
                  <span className="font-semibold text-emerald-700">FREE</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-stone-950 pt-2 border-t border-stone-200">
                  <span>Total Amount</span>
                  <span className="text-amber-700">₹{cartDiscount.finalTotal}</span>
                </div>
              </div>

              {/* Submit via WhatsApp button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{isSubmitting ? 'Processing...' : `Send Order via WhatsApp (₹${cartDiscount.finalTotal})`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-[10px] text-center text-stone-500 leading-normal">
                Order details will be sent directly to One Bite Motihari ({settings.phone || '+91 82104 42538'}). The restaurant team will confirm dish availability, preparation time, and delivery.
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
