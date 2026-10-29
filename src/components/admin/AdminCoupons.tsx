import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext.tsx';
import { useToast } from '../common/Toast.tsx';
import { Coupon, CouponDiscountType, CouponApplicabilityType } from '../../types/index.ts';
import {
  Ticket,
  Plus,
  Search,
  Check,
  X,
  Trash2,
  Edit2,
  Copy,
  Calendar,
  Layers,
  Sparkles,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  Percent,
  IndianRupee,
  Users,
  ShieldAlert,
} from 'lucide-react';

export function AdminCoupons() {
  const { coupons, saveCoupon, deleteCoupon, categories, menuItems } = useRestaurant();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired' | 'inactive'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<CouponDiscountType>('percentage');
  const [discountValue, setDiscountValue] = useState<number | ''>(10);
  const [minOrderAmount, setMinOrderAmount] = useState<number | ''>(200);
  const [maxDiscount, setMaxDiscount] = useState<number | ''>('');
  const [expiryDate, setExpiryDate] = useState('');
  const [usageLimit, setUsageLimit] = useState<number | ''>('');
  const [perCustomerLimit, setPerCustomerLimit] = useState<number | ''>(1);
  const [applicabilityType, setApplicabilityType] = useState<CouponApplicabilityType>('all');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);

  // Helper to generate a unique random promo code
  const generateRandomCode = () => {
    const prefixes = ['OB', 'ONEBITE', 'DELICIOUS', 'TASTY', 'MOTIHARI', 'SAVE', 'FEAST', 'YUMMY'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(10 + Math.random() * 90); // 2 digits
    const suffix = discountType === 'percentage' && discountValue ? `${discountValue}` : `${num}`;
    setCode(`${prefix}${suffix}`);
  };

  const openCreateModal = () => {
    setEditingCoupon(null);
    setCode('');
    setDescription('');
    setDiscountType('percentage');
    setDiscountValue(10);
    setMinOrderAmount(200);
    setMaxDiscount('');
    setExpiryDate('');
    setUsageLimit('');
    setPerCustomerLimit(1);
    setApplicabilityType('all');
    setSelectedCategoryIds([]);
    setSelectedItemIds([]);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setCode(coupon.code);
    setDescription(coupon.description || '');
    setDiscountType(coupon.discountType);
    setDiscountValue(coupon.discountValue);
    setMinOrderAmount(coupon.minOrderAmount);
    setMaxDiscount(coupon.maxDiscount !== undefined && coupon.maxDiscount !== null ? coupon.maxDiscount : '');
    setExpiryDate(coupon.expiryDate ? coupon.expiryDate.slice(0, 16) : '');
    setUsageLimit(coupon.usageLimit !== undefined && coupon.usageLimit !== null ? coupon.usageLimit : '');
    setPerCustomerLimit(coupon.perCustomerLimit !== undefined && coupon.perCustomerLimit !== null ? coupon.perCustomerLimit : 1);
    setApplicabilityType(coupon.applicabilityType || 'all');
    setSelectedCategoryIds(coupon.applicableCategoryIds || []);
    setSelectedItemIds(coupon.applicableItemIds || []);
    setIsActive(coupon.isActive);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();

    if (!cleanCode) {
      showToast('Please enter or generate a coupon code', 'error');
      return;
    }

    if (discountValue === '' || Number(discountValue) <= 0) {
      showToast('Please enter a valid discount value greater than 0', 'error');
      return;
    }

    if (minOrderAmount === '' || Number(minOrderAmount) < 0) {
      showToast('Please enter a valid minimum order amount', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await saveCoupon({
        id: editingCoupon?.id,
        code: cleanCode,
        description: description.trim(),
        discountType,
        discountValue: Number(discountValue),
        minOrderAmount: Number(minOrderAmount),
        maxDiscount: maxDiscount !== '' ? Number(maxDiscount) : null,
        expiryDate: expiryDate ? new Date(expiryDate).toISOString() : null,
        usageLimit: usageLimit !== '' ? Number(usageLimit) : null,
        perCustomerLimit: perCustomerLimit !== '' ? Number(perCustomerLimit) : 1,
        applicabilityType,
        applicableCategoryIds: selectedCategoryIds,
        applicableItemIds: selectedItemIds,
        isActive,
        usedCount: editingCoupon ? editingCoupon.usedCount : 0,
      });

      showToast(`Coupon '${cleanCode}' ${editingCoupon ? 'updated' : 'created'} successfully!`, 'success');
      setIsModalOpen(false);
    } catch (err: any) {
      showToast(err?.message || 'Failed to save coupon code', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      await saveCoupon({
        ...coupon,
        isActive: !coupon.isActive,
      });
      showToast(`Coupon '${coupon.code}' ${!coupon.isActive ? 'activated' : 'deactivated'}`, 'info');
    } catch (err: any) {
      showToast(err?.message || 'Failed to update coupon status', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCoupon(id);
      showToast('Coupon code permanently deleted', 'success');
      setIsDeletingId(null);
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete coupon code', 'error');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast(`Code '${text}' copied to clipboard!`, 'info');
  };

  // Helper function to determine if a coupon is expired
  const isCouponExpired = (c: Coupon): boolean => {
    if (!c.expiryDate) return false;
    const expiryTime = new Date(c.expiryDate).getTime();
    return !isNaN(expiryTime) && expiryTime < Date.now();
  };

  // Filter & Search Logic
  const filteredCoupons = coupons.filter(c => {
    const matchesSearch =
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const expired = isCouponExpired(c);

    if (filterStatus === 'active') return matchesSearch && c.isActive && !expired;
    if (filterStatus === 'expired') return matchesSearch && expired;
    if (filterStatus === 'inactive') return matchesSearch && !c.isActive;
    return matchesSearch;
  });

  // Calculate Statistics
  const totalCouponsCount = coupons.length;
  const activeCouponsCount = coupons.filter(c => c.isActive && !isCouponExpired(c)).length;
  const expiredCouponsCount = coupons.filter(c => isCouponExpired(c)).length;
  const totalRedemptionsCount = coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-stone-900 text-white p-5 sm:p-6 rounded-2xl shadow-sm border border-stone-800">
        <div>
          <div className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-wider mb-1">
            <Ticket className="w-4 h-4" />
            <span>Discount & Marketing Engine</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white">Coupon Code Management</h1>
          <p className="text-xs sm:text-sm text-stone-400 mt-1 max-w-2xl">
            Create, track, and synchronize promo codes for One Bite customers. Discount rules apply automatically at online checkout.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs sm:text-sm font-bold transition-all shadow-xs shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Coupon</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">Total Coupons</span>
            <div className="p-2 bg-stone-100 rounded-lg text-stone-700">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-stone-900 mt-2">{totalCouponsCount}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700">Active & Ready</span>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">{activeCouponsCount}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700">Total Redemptions</span>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700 mt-2">{totalRedemptionsCount}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700">Expired Codes</span>
            <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 mt-2">{expiredCouponsCount}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search coupon code or description..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              filterStatus === 'all' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            All ({coupons.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              filterStatus === 'active' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Active ({activeCouponsCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('expired')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              filterStatus === 'expired' ? 'bg-rose-600 text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Expired ({expiredCouponsCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('inactive')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              filterStatus === 'inactive' ? 'bg-stone-800 text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Inactive
          </button>
        </div>
      </div>

      {/* Coupons Table / Grid */}
      {filteredCoupons.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-stone-200 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
            <Ticket className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-stone-900">No coupon codes found</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1 mb-4">
            {searchQuery ? 'Try adjusting your search query or filter settings.' : 'Create your first discount promo code to attract more hungry customers!'}
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-2xs cursor-pointer"
          >
            Create First Coupon
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCoupons.map(coupon => {
            const expired = isCouponExpired(coupon);
            const usagePercent =
              coupon.usageLimit && coupon.usageLimit > 0
                ? Math.min(100, Math.round(((coupon.usedCount || 0) / coupon.usageLimit) * 100))
                : 0;

            return (
              <div
                key={coupon.id}
                className={`bg-white rounded-2xl border transition-all p-4 flex flex-col justify-between shadow-2xs relative ${
                  !coupon.isActive || expired ? 'border-stone-200 bg-stone-50/60 opacity-85' : 'border-amber-200/80 hover:border-amber-400'
                }`}
              >
                <div>
                  {/* Top Header: Code & Status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-base font-black tracking-wider uppercase bg-stone-900 text-amber-400 px-3 py-1 rounded-xl shadow-2xs flex items-center gap-2">
                        {coupon.code}
                        <button
                          type="button"
                          onClick={() => copyToClipboard(coupon.code)}
                          className="hover:text-white transition-colors cursor-pointer p-0.5"
                          title="Copy Code"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {expired ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                          Expired
                        </span>
                      ) : !coupon.isActive ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-stone-200 text-stone-700 border border-stone-300">
                          Inactive
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                          Active
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Discount Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl font-extrabold text-stone-900">
                        {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`}
                      </span>
                      {coupon.discountType === 'percentage' && coupon.maxDiscount && (
                        <span className="text-xs font-semibold text-stone-500">
                          (Max Cap: ₹{coupon.maxDiscount})
                        </span>
                      )}
                    </div>

                    {coupon.description && (
                      <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                        {coupon.description}
                      </p>
                    )}
                  </div>

                  {/* Coupon Conditions */}
                  <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/80 space-y-1.5 text-xs text-stone-600 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-stone-500">Min Food Order:</span>
                      <span className="font-bold text-stone-900">₹{coupon.minOrderAmount}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-medium text-stone-500">Per-Customer Limit:</span>
                      <span className="font-bold text-stone-900">{coupon.perCustomerLimit || 1} redemption</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-medium text-stone-500">Expiry Date:</span>
                      <span className="font-semibold text-stone-800">
                        {coupon.expiryDate
                          ? new Date(coupon.expiryDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Never Expires'}
                      </span>
                    </div>

                    {/* Redemptions Progress */}
                    <div className="pt-1.5 border-t border-stone-200">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-medium text-stone-500">Total Redemptions:</span>
                        <span className="font-bold text-stone-900">
                          {coupon.usedCount || 0} / {coupon.usageLimit ? coupon.usageLimit : '∞'}
                        </span>
                      </div>
                      {coupon.usageLimit && coupon.usageLimit > 0 && (
                        <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              usagePercent >= 100 ? 'bg-rose-500' : usagePercent >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${usagePercent}%` }}
                          ></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                  {/* Toggle Active Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleActive(coupon)}
                    className={`inline-flex items-center gap-1.5 text-xs font-bold py-1.5 px-3 rounded-lg transition-colors cursor-pointer ${
                      coupon.isActive
                        ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                    }`}
                  >
                    {coupon.isActive ? <ToggleRight className="w-4 h-4 text-emerald-600" /> : <ToggleLeft className="w-4 h-4 text-stone-400" />}
                    <span>{coupon.isActive ? 'Active' : 'Inactive'}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(coupon)}
                      className="p-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
                      title="Edit Coupon"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsDeletingId(coupon.id)}
                      className="p-2 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete Coupon"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeletingId && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setIsDeletingId(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-stone-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-stone-900 mb-1">Delete Coupon Code?</h3>
            <p className="text-xs text-stone-500 mb-6">
              Are you sure you want to delete this coupon? Customers will no longer be able to redeem it at checkout.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setIsDeletingId(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(isDeletingId)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-xs"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Coupon Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-xl w-full my-8 shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-stone-900 text-white p-5 border-b border-stone-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-600 rounded-xl">
                  <Ticket className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    {editingCoupon ? 'Edit Coupon Code' : 'Create New Coupon Code'}
                  </h3>
                  <p className="text-xs text-amber-400 font-medium">
                    Configure real-time discount parameters for checkout
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSave} className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-stone-900">
              {/* Coupon Code Row */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                  Coupon Code <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. ONEBITE20, SAVE50, MOTIHARI100"
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase())}
                    className="flex-1 px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-mono text-sm font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={generateRandomCode}
                    className="px-3.5 py-2.5 bg-stone-100 hover:bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold rounded-xl transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate</span>
                  </button>
                </div>
                <p className="text-[11px] text-stone-500">
                  Code will automatically convert to uppercase (e.g., ONEBITE20).
                </p>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                  Short Description / Terms
                </label>
                <input
                  type="text"
                  placeholder="e.g. Get 20% OFF on orders above ₹200 (Max Cap ₹100)"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Discount Type & Value Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Discount Type */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                    Discount Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDiscountType('percentage')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        discountType === 'percentage'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      <Percent className="w-3.5 h-3.5" />
                      <span>Percentage (%)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscountType('fixed')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        discountType === 'fixed'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      <IndianRupee className="w-3.5 h-3.5" />
                      <span>Fixed Amount (₹)</span>
                    </button>
                  </div>
                </div>

                {/* Discount Value */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                    Discount Value ({discountType === 'percentage' ? '%' : '₹'}) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder={discountType === 'percentage' ? 'e.g. 20' : 'e.g. 50'}
                    value={discountValue}
                    onChange={e => setDiscountValue(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-extrabold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Minimum Order Amount & Max Discount Cap Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                    Minimum Order Amount (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="e.g. 200"
                    value={minOrderAmount}
                    onChange={e => setMinOrderAmount(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-[11px] text-stone-500">Food subtotal required before coupon applies.</p>
                </div>

                {discountType === 'percentage' && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                      Maximum Discount Cap (₹) <span className="text-stone-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 100"
                      value={maxDiscount}
                      onChange={e => setMaxDiscount(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <p className="text-[11px] text-stone-500">Caps maximum discount for percentage coupons.</p>
                  </div>
                )}
              </div>

              {/* Expiry Date and Time */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                  Expiry Date & Time <span className="text-stone-400 font-normal">(Leave empty for no expiry)</span>
                </label>
                <input
                  type="datetime-local"
                  value={expiryDate}
                  onChange={e => setExpiryDate(e.target.value)}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Usage Limits Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                    Total Global Usage Limit <span className="text-stone-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 100 (Leave blank for unlimited)"
                    value={usageLimit}
                    onChange={e => setUsageLimit(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                    Per-Customer Usage Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 1"
                    value={perCustomerLimit}
                    onChange={e => setPerCustomerLimit(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-[11px] text-stone-500">Max redemptions allowed per phone number.</p>
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-stone-50 rounded-2xl border border-stone-200">
                <div>
                  <span className="text-xs font-bold text-stone-900 block">Coupon Status</span>
                  <span className="text-[11px] text-stone-500">
                    {isActive ? 'Active and redeemable at checkout' : 'Disabled (Hidden from validation)'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`p-1 rounded-full transition-colors cursor-pointer ${isActive ? 'text-amber-600' : 'text-stone-400'}`}
                >
                  {isActive ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                </button>
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-4 border-t border-stone-200 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
