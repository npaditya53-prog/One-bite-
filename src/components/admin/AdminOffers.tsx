import React, { useState, useMemo } from 'react';
import { useRestaurant } from '../../context/RestaurantContext.tsx';
import { OfferItem, OfferType, OfferTarget, OfferStatus, MenuItem } from '../../types/index.ts';
import { useToast } from '../common/Toast.tsx';
import {
  Plus,
  Trash2,
  Edit2,
  Copy,
  Tag,
  X,
  Calendar,
  Clock,
  Eye,
  EyeOff,
  Pause,
  Play,
  CheckCircle2,
  AlertCircle,
  Percent,
  IndianRupee,
  Gift,
  Sparkles,
  Search,
  Upload,
  Image as ImageIcon,
  Check,
} from 'lucide-react';
import { FoodTypeBadge } from '../common/FoodTypeBadge.tsx';
import { getOfferStatus, getOfferTargetLabel } from '../../utils/offerUtils.ts';

const PRESET_POSTERS = [
  {
    label: 'Delicious Combo',
    url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Chicken Bucket Feast',
    url: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Cheesy Pizza Special',
    url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Crispy Tornado Fries',
    url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Refreshing Beverages',
    url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80',
  },
];

export function AdminOffers() {
  const { offers, categories, menuItems, saveOffer, deleteOffer, uploadImage } = useRestaurant();
  const { showToast } = useToast();

  const [activeTabFilter, setActiveTabFilter] = useState<'all' | OfferStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Partial<OfferItem> | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [itemSearchText, setItemSearchText] = useState('');

  // Status Metrics
  const metrics = useMemo(() => {
    let active = 0;
    let scheduled = 0;
    let expired = 0;
    let paused = 0;
    let draft = 0;

    for (const o of offers) {
      const st = getOfferStatus(o);
      if (st === 'active') active++;
      else if (st === 'scheduled') scheduled++;
      else if (st === 'expired') expired++;
      else if (st === 'paused') paused++;
      else if (st === 'draft') draft++;
    }

    return { total: offers.length, active, scheduled, expired, paused, draft };
  }, [offers]);

  // Filtered Offers
  const filteredOffers = useMemo(() => {
    return offers.filter(offer => {
      const status = getOfferStatus(offer);
      if (activeTabFilter !== 'all' && status !== activeTabFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = offer.title.toLowerCase().includes(q);
        const matchesCode = offer.code?.toLowerCase().includes(q);
        const matchesDesc = offer.description.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCode && !matchesDesc) return false;
      }

      return true;
    });
  }, [offers, activeTabFilter, searchQuery]);

  // Format Helper for Input datetime-local (YYYY-MM-DDTHH:mm)
  const toDateTimeLocal = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return '';
    }
  };

  const handleOpenAdd = () => {
    const now = new Date();
    const nextMonth = new Date(now);
    nextMonth.setDate(nextMonth.getDate() + 30);

    setEditingOffer({
      title: '',
      description: '',
      offerType: 'percentage',
      discountValue: 10,
      discount: '10% OFF',
      targetType: 'all',
      targetCategoryIds: [],
      targetItemIds: [],
      startDate: toDateTimeLocal(now.toISOString()),
      endDate: toDateTimeLocal(nextMonth.toISOString()),
      imageUrl: PRESET_POSTERS[0].url,
      code: '',
      terms: 'Valid for dine-in & takeaway in Motihari.',
      isPublic: true,
      status: 'active',
      active: true,
      minOrderValue: undefined,
    });
    setItemSearchText('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (offer: OfferItem) => {
    setEditingOffer({
      ...offer,
      startDate: toDateTimeLocal(offer.startDate),
      endDate: toDateTimeLocal(offer.endDate),
      isPublic: offer.isPublic !== false,
      active: offer.active !== false,
      targetType: offer.targetType || 'all',
      offerType: offer.offerType || 'percentage',
      targetCategoryIds: offer.targetCategoryIds || [],
      targetItemIds: offer.targetItemIds || [],
    });
    setItemSearchText('');
    setIsModalOpen(true);
  };

  const handleDuplicate = async (offer: OfferItem) => {
    try {
      const duplicated: Partial<OfferItem> = {
        ...offer,
        id: undefined,
        title: `${offer.title} (Copy)`,
        status: 'draft',
        active: false,
        isPublic: false,
      };
      await saveOffer(duplicated);
      showToast(`Duplicated "${offer.title}" as draft!`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to duplicate offer', 'error');
    }
  };

  const handleTogglePause = async (offer: OfferItem) => {
    const currentStatus = getOfferStatus(offer);
    const willPause = currentStatus === 'active' || currentStatus === 'scheduled';
    const newStatus: OfferStatus = willPause ? 'paused' : 'active';

    try {
      await saveOffer({
        ...offer,
        status: newStatus,
        active: !willPause,
      });
      showToast(`Offer "${offer.title}" is now ${willPause ? 'paused' : 'activated'}!`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to update offer status', 'error');
    }
  };

  const handleSave = async (asDraft: boolean = false) => {
    if (!editingOffer?.title?.trim()) {
      showToast('Please enter an offer title', 'error');
      return;
    }
    if (!editingOffer?.description?.trim()) {
      showToast('Please enter a brief offer description', 'error');
      return;
    }

    // Dynamic Discount Badge text generation if not manually customized
    let discountBadge = editingOffer.discount || '';
    const offerType = editingOffer.offerType || 'percentage';
    const val = editingOffer.discountValue || 0;

    if (!discountBadge || discountBadge === 'Special Offer') {
      if (offerType === 'percentage') discountBadge = `${val}% OFF`;
      else if (offerType === 'flat_amount') discountBadge = `FLAT ₹${val} OFF`;
      else if (offerType === 'fixed_price') discountBadge = `NOW AT ₹${val}`;
      else if (offerType === 'bogo') discountBadge = 'BUY 1 GET 1 FREE';
      else discountBadge = 'SPECIAL DEAL';
    }

    const finalStatus: OfferStatus = asDraft ? 'draft' : 'active';
    const finalActive = !asDraft && (editingOffer.isPublic !== false);

    const payload: Partial<OfferItem> = {
      ...editingOffer,
      title: editingOffer.title.trim(),
      description: editingOffer.description.trim(),
      discount: discountBadge,
      status: finalStatus,
      active: finalActive,
      isPublic: editingOffer.isPublic !== false,
      code: editingOffer.code ? editingOffer.code.trim().toUpperCase() : '',
    };

    try {
      await saveOffer(payload);
      showToast(
        asDraft
          ? 'Offer saved as draft.'
          : editingOffer.id
          ? 'Offer updated successfully!'
          : 'Offer published successfully!',
        'success'
      );
      setIsModalOpen(false);
      setEditingOffer(null);
    } catch (err: any) {
      showToast(err?.message || 'Failed to save offer', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteOffer(id);
      showToast('Offer deleted successfully.', 'info');
      setDeleteId(null);
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete offer', 'error');
    }
  };

  // Image Upload Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      showToast('Image size exceeds 3MB', 'error');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const uploadedUrl = await uploadImage(base64, file.name);
        setEditingOffer(prev => (prev ? { ...prev, imageUrl: uploadedUrl } : null));
        showToast('Image uploaded successfully!', 'success');
      } catch (err: any) {
        showToast(err?.message || 'Failed to upload image', 'error');
      } finally {
        setIsUploading(false);
      }
    };
    reader.onerror = () => {
      setIsUploading(false);
      showToast('Error reading image file', 'error');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900">
              Special Offers Management
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-500">
            Create, schedule, and automate promotional discounts, BOGO deals, and coupon codes for One Bite Motihari.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow-md transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create New Offer</span>
        </button>
      </div>

      {/* Metrics Chips Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          onClick={() => setActiveTabFilter('all')}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeTabFilter === 'all'
              ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
              : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider block opacity-75">All Offers</span>
          <span className="text-xl font-extrabold">{metrics.total}</span>
        </button>

        <button
          onClick={() => setActiveTabFilter('active')}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeTabFilter === 'active'
              ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
              : 'bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-50/50'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider block opacity-80 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Active Now
          </span>
          <span className="text-xl font-extrabold">{metrics.active}</span>
        </button>

        <button
          onClick={() => setActiveTabFilter('scheduled')}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeTabFilter === 'scheduled'
              ? 'bg-sky-700 text-white border-sky-700 shadow-xs'
              : 'bg-white text-sky-800 border-sky-200 hover:bg-sky-50/50'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider block opacity-80">Scheduled</span>
          <span className="text-xl font-extrabold">{metrics.scheduled}</span>
        </button>

        <button
          onClick={() => setActiveTabFilter('paused')}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeTabFilter === 'paused'
              ? 'bg-amber-700 text-white border-amber-700 shadow-xs'
              : 'bg-white text-amber-800 border-amber-200 hover:bg-amber-50/50'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider block opacity-80">Paused</span>
          <span className="text-xl font-extrabold">{metrics.paused + metrics.draft}</span>
        </button>

        <button
          onClick={() => setActiveTabFilter('expired')}
          className={`p-3 rounded-xl border text-left transition-all col-span-2 sm:col-span-1 ${
            activeTabFilter === 'expired'
              ? 'bg-stone-600 text-white border-stone-600 shadow-xs'
              : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider block opacity-80">Expired</span>
          <span className="text-xl font-extrabold">{metrics.expired}</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search offers by name, coupon code, or keyword..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Offers Cards Grid */}
      {filteredOffers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Tag className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-stone-900 mb-1">No offers found</h3>
          <p className="text-xs sm:text-sm text-stone-500 max-w-sm mx-auto mb-5">
            {searchQuery
              ? `No offers match your query "${searchQuery}".`
              : activeTabFilter !== 'all'
              ? `No offers currently under status "${activeTabFilter}".`
              : 'You have not created any special offers yet.'}
          </p>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Offer</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredOffers.map(offer => {
            const status = getOfferStatus(offer);
            const targetLabel = getOfferTargetLabel(offer);

            // Status Badge Config
            const statusBadgeConfig = {
              active: {
                bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                label: 'Active on Site',
                dot: 'bg-emerald-500 animate-pulse',
              },
              scheduled: {
                bg: 'bg-sky-100 text-sky-800 border-sky-300',
                label: 'Scheduled',
                dot: 'bg-sky-500',
              },
              paused: {
                bg: 'bg-amber-100 text-amber-800 border-amber-300',
                label: 'Paused',
                dot: 'bg-amber-500',
              },
              draft: {
                bg: 'bg-purple-100 text-purple-800 border-purple-300',
                label: 'Draft',
                dot: 'bg-purple-500',
              },
              expired: {
                bg: 'bg-stone-100 text-stone-600 border-stone-300',
                label: 'Expired',
                dot: 'bg-stone-400',
              },
            }[status];

            return (
              <div
                key={offer.id}
                className="bg-white rounded-2xl border border-stone-200/90 shadow-xs flex flex-col justify-between overflow-hidden hover:border-amber-400/50 hover:shadow-md transition-all"
              >
                {/* Poster / Header Row */}
                <div className="relative">
                  {offer.imageUrl && (
                    <div className="h-36 w-full bg-stone-100 overflow-hidden relative">
                      <img
                        src={offer.imageUrl}
                        alt={offer.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    </div>
                  )}

                  {/* Badges on top of card or banner */}
                  <div className="p-4 flex items-center justify-between gap-2">
                    <span className="bg-amber-600 text-white text-xs font-extrabold px-3 py-1 rounded-xl shadow-xs">
                      {offer.discount}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${statusBadgeConfig.bg}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusBadgeConfig.dot}`} />
                        <span>{statusBadgeConfig.label}</span>
                      </span>

                      {offer.isPublic === false && (
                        <span
                          className="p-1 text-stone-400 bg-stone-100 rounded-md"
                          title="Hidden from public website"
                        >
                          <EyeOff className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Offer Details */}
                <div className="px-5 pb-4 flex-1">
                  <h3 className="text-base font-extrabold text-stone-900 mb-1 leading-snug">
                    {offer.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed mb-4 line-clamp-2">
                    {offer.description}
                  </p>

                  <div className="space-y-2 text-xs text-stone-600 pt-2 border-t border-stone-100">
                    <div className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="font-semibold text-stone-900">Applies To:</span>
                      <span className="truncate">{targetLabel}</span>
                    </div>

                    {(offer.startDate || offer.endDate) && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="font-semibold text-stone-900">Validity:</span>
                        <span className="truncate">
                          {offer.startDate ? new Date(offer.startDate).toLocaleDateString() : 'Immediate'}
                          {' — '}
                          {offer.endDate ? new Date(offer.endDate).toLocaleDateString() : 'Ongoing'}
                        </span>
                      </div>
                    )}

                    {offer.code && (
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-stone-900">Coupon Code:</span>
                        <span className="font-mono bg-stone-100 px-2 py-0.5 rounded text-stone-800 font-bold text-[11px]">
                          {offer.code}
                        </span>
                      </div>
                    )}

                    {offer.terms && (
                      <p className="text-[11px] text-stone-500 italic truncate">
                        Terms: {offer.terms}
                      </p>
                    )}
                  </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="p-3 px-5 bg-stone-50 border-t border-stone-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleTogglePause(offer)}
                    className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
                      status === 'active' || status === 'scheduled'
                        ? 'text-amber-800 bg-amber-100/70 hover:bg-amber-200/80'
                        : 'text-emerald-800 bg-emerald-100 hover:bg-emerald-200'
                    }`}
                    title={status === 'active' ? 'Pause offer' : 'Activate offer'}
                  >
                    {status === 'active' || status === 'scheduled' ? (
                      <>
                        <Pause className="w-3.5 h-3.5" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        <span>Activate</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDuplicate(offer)}
                      className="p-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-200/70 transition-colors"
                      title="Duplicate offer as draft"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleOpenEdit(offer)}
                      className="p-2 rounded-lg text-amber-700 hover:text-amber-900 hover:bg-amber-100/60 transition-colors"
                      title="Edit offer details"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setDeleteId(offer.id)}
                      className="p-2 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-100/60 transition-colors"
                      title="Delete offer"
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
      {deleteId && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-stone-200">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-stone-900 mb-1">Delete this Offer?</h3>
            <p className="text-xs sm:text-sm text-stone-600 mb-6">
              This promotion will be permanently removed from the website and database.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
              >
                Delete Offer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Offer Modal */}
      {isModalOpen && editingOffer && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in overflow-y-auto"
        >
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl border border-stone-200 my-auto max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 shrink-0">
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-stone-900">
                  {editingOffer.id ? 'Edit Special Offer' : 'Create New Special Offer'}
                </h2>
                <p className="text-xs text-stone-500">
                  Fill in the promotion rules and eligibility.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1">
              {/* Field 1: Offer Name */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  1. Offer Name *
                </label>
                <input
                  type="text"
                  required
                  value={editingOffer.title || ''}
                  onChange={e => setEditingOffer({ ...editingOffer, title: e.target.value })}
                  placeholder="e.g. Navratri Special Offer, Weekend Burger Combo"
                  className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
              </div>

              {/* Field 2: Short Description */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  2. Short Description *
                </label>
                <textarea
                  rows={2}
                  required
                  value={editingOffer.description || ''}
                  onChange={e => setEditingOffer({ ...editingOffer, description: e.target.value })}
                  placeholder="e.g. Save on vegetarian favourites across Motihari with exclusive festive discount!"
                  className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
              </div>

              {/* Field 3 & 4: Offer Type and Discount Value */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-stone-50 p-4 rounded-2xl border border-stone-200">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    3. Offer Type *
                  </label>
                  <select
                    value={editingOffer.offerType || 'percentage'}
                    onChange={e => {
                      const type = e.target.value as OfferType;
                      setEditingOffer({
                        ...editingOffer,
                        offerType: type,
                        discount:
                          type === 'percentage'
                            ? `${editingOffer.discountValue || 10}% OFF`
                            : type === 'flat_amount'
                            ? `FLAT ₹${editingOffer.discountValue || 50} OFF`
                            : type === 'fixed_price'
                            ? `NOW AT ₹${editingOffer.discountValue || 99}`
                            : type === 'bogo'
                            ? 'BUY 1 GET 1 FREE'
                            : 'SPECIAL DEAL',
                      });
                    }}
                    className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  >
                    <option value="percentage">Percentage Discount (%)</option>
                    <option value="flat_amount">Flat Amount Discount (₹)</option>
                    <option value="fixed_price">Special Fixed Price (₹)</option>
                    <option value="bogo">Buy One Get One (BOGO)</option>
                    <option value="custom">Custom Promotional Offer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    4. Discount Value / Badge
                  </label>
                  {editingOffer.offerType === 'bogo' ? (
                    <div className="px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-bold text-amber-700 flex items-center gap-1.5 h-[42px]">
                      <Gift className="w-4 h-4" />
                      <span>Cheapest eligible item free in pairs</span>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={editingOffer.discountValue ?? ''}
                        onChange={e => {
                          const val = e.target.value === '' ? undefined : Number(e.target.value);
                          const type = editingOffer.offerType || 'percentage';
                          let badge = editingOffer.discount;
                          if (type === 'percentage') badge = `${val || 0}% OFF`;
                          else if (type === 'flat_amount') badge = `FLAT ₹${val || 0} OFF`;
                          else if (type === 'fixed_price') badge = `NOW AT ₹${val || 0}`;

                          setEditingOffer({
                            ...editingOffer,
                            discountValue: val,
                            discount: badge,
                          });
                        }}
                        placeholder={editingOffer.offerType === 'percentage' ? '10 (for 10%)' : '50 (for ₹50)'}
                        className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                        {editingOffer.offerType === 'percentage' ? '%' : '₹'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Display Badge Text (Preview on Public Card)
                  </label>
                  <input
                    type="text"
                    value={editingOffer.discount || ''}
                    onChange={e => setEditingOffer({ ...editingOffer, discount: e.target.value })}
                    placeholder="e.g. 10% OFF, FLAT ₹50 OFF"
                    className="w-full px-3.5 py-2 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm font-bold text-amber-700 focus:outline-none"
                  />
                </div>
              </div>

              {/* Field 5: Apply Offer To (Eligibility Scope) */}
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-3">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                  5. Apply Offer To (Strict Invariant: Veg offers never apply to non-veg)
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'all', label: 'All Menu Items' },
                    { id: 'veg_only', label: 'Veg Items Only', badge: 'veg' },
                    { id: 'non_veg_only', label: 'Non-Veg Items Only', badge: 'non_veg' },
                    { id: 'categories', label: 'Selected Categories' },
                    { id: 'items', label: 'Selected Items' },
                  ].map(opt => (
                    <label
                      key={opt.id}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                        (editingOffer.targetType || 'all') === opt.id
                          ? 'bg-amber-50 border-amber-500 text-amber-950 font-bold'
                          : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100/60'
                      }`}
                    >
                      <input
                        type="radio"
                        name="targetType"
                        value={opt.id}
                        checked={(editingOffer.targetType || 'all') === opt.id}
                        onChange={() =>
                          setEditingOffer({
                            ...editingOffer,
                            targetType: opt.id as OfferTarget,
                          })
                        }
                        className="text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-xs">{opt.label}</span>
                    </label>
                  ))}
                </div>

                {/* Sub-selector: Categories */}
                {editingOffer.targetType === 'categories' && (
                  <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-2 mt-2">
                    <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block">
                      Select Eligible Categories:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                      {categories.map(cat => {
                        const checked = Boolean(
                          editingOffer.targetCategoryIds && editingOffer.targetCategoryIds.includes(cat.id)
                        );
                        return (
                          <label
                            key={cat.id}
                            className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer p-1.5 hover:bg-stone-50 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={e => {
                                const current = editingOffer.targetCategoryIds || [];
                                const updated = e.target.checked
                                  ? [...current, cat.id]
                                  : current.filter(id => id !== cat.id);
                                setEditingOffer({ ...editingOffer, targetCategoryIds: updated });
                              }}
                              className="w-3.5 h-3.5 rounded text-amber-600"
                            />
                            <span className="truncate">{cat.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Sub-selector: Individual Items */}
                {editingOffer.targetType === 'items' && (
                  <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-2 mt-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block">
                        Select Individual Menu Items: ({editingOffer.targetItemIds?.length || 0} selected)
                      </span>
                    </div>

                    <input
                      type="text"
                      placeholder="Type to filter dishes..."
                      value={itemSearchText}
                      onChange={e => setItemSearchText(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded-lg focus:outline-none"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
                      {menuItems
                        .filter(i =>
                          itemSearchText ? i.name.toLowerCase().includes(itemSearchText.toLowerCase()) : true
                        )
                        .slice(0, 30)
                        .map(item => {
                          const checked = Boolean(
                            editingOffer.targetItemIds && editingOffer.targetItemIds.includes(item.id)
                          );
                          return (
                            <label
                              key={item.id}
                              className="flex items-center gap-2 text-xs text-stone-800 cursor-pointer p-1.5 hover:bg-stone-50 rounded border border-transparent hover:border-stone-200"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={e => {
                                  const current = editingOffer.targetItemIds || [];
                                  const updated = e.target.checked
                                    ? [...current, item.id]
                                    : current.filter(id => id !== item.id);
                                  setEditingOffer({ ...editingOffer, targetItemIds: updated });
                                }}
                                className="w-3.5 h-3.5 rounded text-amber-600"
                              />
                              <FoodTypeBadge type={item.foodType} />
                              <span className="truncate flex-1 font-medium">{item.name}</span>
                              <span className="text-[11px] text-stone-500 font-bold">
                                ₹{typeof item.price === 'number' ? item.price : 'MRP'}
                              </span>
                            </label>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>

              {/* Field 6 & 7: Start and End Date Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    6. Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={editingOffer.startDate || ''}
                    onChange={e => setEditingOffer({ ...editingOffer, startDate: e.target.value })}
                    className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    7. End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={editingOffer.endDate || ''}
                    onChange={e => setEditingOffer({ ...editingOffer, endDate: e.target.value })}
                    className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none"
                  />
                </div>
              </div>

              {/* Field 8: Image / Poster */}
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-3">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                  8. Offer Image / Poster
                </label>

                <div className="flex flex-col sm:flex-row gap-3 items-center">
                  {editingOffer.imageUrl ? (
                    <div className="w-24 h-20 rounded-xl bg-stone-200 overflow-hidden relative shrink-0 border border-stone-300">
                      <img
                        src={editingOffer.imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-20 rounded-xl bg-stone-200/60 border border-dashed border-stone-300 flex items-center justify-center text-stone-400 shrink-0">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}

                  <div className="flex-1 space-y-2 w-full">
                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold cursor-pointer">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isUploading ? 'Uploading...' : 'Upload Image'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={isUploading}
                          className="hidden"
                        />
                      </label>
                      <span className="text-[11px] text-stone-500">or pick from presets below</span>
                    </div>

                    <input
                      type="text"
                      value={editingOffer.imageUrl || ''}
                      onChange={e => setEditingOffer({ ...editingOffer, imageUrl: e.target.value })}
                      placeholder="Paste image URL here..."
                      className="w-full px-3 py-1.5 text-xs bg-white border border-stone-200 rounded-lg focus:outline-none"
                    />
                  </div>
                </div>

                {/* Preset Posters */}
                <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1">
                  {PRESET_POSTERS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setEditingOffer({ ...editingOffer, imageUrl: preset.url })}
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-white border border-stone-200 text-stone-700 hover:border-amber-500 shrink-0"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Field 9: Coupon Code & Min Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Coupon Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={editingOffer.code || ''}
                    onChange={e =>
                      setEditingOffer({ ...editingOffer, code: e.target.value.toUpperCase() })
                    }
                    placeholder="e.g. NAVRATRI10, ONEBITE50"
                    className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-xs sm:text-sm font-mono uppercase focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Min. Order Amount (₹, Optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingOffer.minOrderValue ?? ''}
                    onChange={e =>
                      setEditingOffer({
                        ...editingOffer,
                        minOrderValue: e.target.value === '' ? undefined : Number(e.target.value),
                      })
                    }
                    placeholder="e.g. 199"
                    className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none"
                  />
                </div>
              </div>

              {/* Field 10: Terms and Conditions */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  10. Terms & Conditions (Optional)
                </label>
                <input
                  type="text"
                  value={editingOffer.terms || ''}
                  onChange={e => setEditingOffer({ ...editingOffer, terms: e.target.value })}
                  placeholder="e.g. Valid on dine-in and takeaway. Cannot be combined with other offers."
                  className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none"
                />
              </div>

              {/* Field 11: Public Website Display Toggle */}
              <div className="pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer bg-stone-50 p-3 rounded-xl border border-stone-200">
                  <input
                    type="checkbox"
                    checked={editingOffer.isPublic !== false}
                    onChange={e => setEditingOffer({ ...editingOffer, isPublic: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-stone-900 block">
                      Show Offer on Public Website
                    </span>
                    <span className="text-[11px] text-stone-500 block">
                      Visible in the "Special Deals & Combos" section on the homepage.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Modal Action Buttons: Save as Draft and Publish Offer */}
            <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => handleSave(true)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-stone-200 hover:bg-stone-300 text-stone-800 transition-colors"
              >
                Save as Draft
              </button>

              <button
                type="button"
                onClick={() => handleSave(false)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white shadow-xs transition-colors"
              >
                Publish Offer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
