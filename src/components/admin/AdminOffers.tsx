import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext.tsx';
import { OfferItem } from '../../types/index.ts';
import { useToast } from '../common/Toast.tsx';
import { Plus, Trash2, Edit2, Tag, X } from 'lucide-react';

export function AdminOffers() {
  const { offers, saveOffer, deleteOffer } = useRestaurant();
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Partial<OfferItem> | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleOpenAdd = () => {
    setEditingOffer({
      title: '',
      description: '',
      discount: 'Special Offer',
      code: '',
      active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (offer: OfferItem) => {
    setEditingOffer({ ...offer });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOffer?.title || !editingOffer?.description) {
      showToast('Title and description are required', 'error');
      return;
    }

    try {
      await saveOffer(editingOffer);
      showToast(editingOffer.id ? 'Offer updated!' : 'Offer created!', 'success');
      setIsModalOpen(false);
      setEditingOffer(null);
    } catch (err: any) {
      showToast(err?.message || 'Failed to save offer', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteOffer(id);
      showToast('Offer deleted.', 'info');
      setDeleteId(null);
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete offer', 'error');
    }
  };

  const handleToggleActive = async (offer: OfferItem) => {
    try {
      await saveOffer({ ...offer, active: !offer.active });
      showToast(`Offer "${offer.title}" status updated!`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to update offer', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900">Offers & Combos Management</h1>
          <p className="text-xs sm:text-sm text-stone-500">
            Create promotional deals and coupon codes that appear on the homepage.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Deal</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {offers.map(offer => (
          <div
            key={offer.id}
            className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-lg">
                  {offer.discount}
                </span>

                <button
                  onClick={() => handleToggleActive(offer)}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                    offer.active
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-stone-100 text-stone-500'
                  }`}
                >
                  {offer.active ? 'Active on Site' : 'Inactive'}
                </button>
              </div>

              <h3 className="text-base font-bold text-stone-900 mb-1">{offer.title}</h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed mb-4">
                {offer.description}
              </p>

              {offer.code && (
                <div className="inline-block bg-stone-100 px-2.5 py-1 rounded font-mono text-xs text-stone-800 font-semibold mb-4">
                  Code: {offer.code}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-2">
              <button
                onClick={() => handleOpenEdit(offer)}
                className="p-1.5 rounded-lg text-amber-700 hover:text-amber-900 hover:bg-amber-50"
              >
                <Edit2 className="w-4 h-4" />
              </button>

              <button
                onClick={() => setDeleteId(offer.id)}
                className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Dialog */}
      {deleteId && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-stone-200">
            <h3 className="text-lg font-bold text-stone-900 mb-2">Delete Offer?</h3>
            <p className="text-xs sm:text-sm text-stone-600 mb-6">
              This promotion will be removed immediately.
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
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white"
              >
                Delete Offer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Form */}
      {isModalOpen && editingOffer && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-stone-900">
                {editingOffer.id ? 'Edit Offer' : 'Create Special Deal'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Offer Title *
                </label>
                <input
                  type="text"
                  required
                  value={editingOffer.title || ''}
                  onChange={e => setEditingOffer({ ...editingOffer, title: e.target.value })}
                  placeholder="e.g. Snack Combo Treat"
                  className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Discount Badge Text *
                </label>
                <input
                  type="text"
                  required
                  value={editingOffer.discount || ''}
                  onChange={e => setEditingOffer({ ...editingOffer, discount: e.target.value })}
                  placeholder="e.g. Save ₹40 or 20% OFF"
                  className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Coupon Code (Optional)
                </label>
                <input
                  type="text"
                  value={editingOffer.code || ''}
                  onChange={e => setEditingOffer({ ...editingOffer, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. ONEBITE40"
                  className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-sm font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Description *
                </label>
                <textarea
                  rows={3}
                  required
                  value={editingOffer.description || ''}
                  onChange={e => setEditingOffer({ ...editingOffer, description: e.target.value })}
                  placeholder="Details on what combo is included and terms..."
                  className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-800">
                  <input
                    type="checkbox"
                    checked={editingOffer.active !== false}
                    onChange={e => setEditingOffer({ ...editingOffer, active: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-600"
                  />
                  <span>Display Offer on Homepage</span>
                </label>
              </div>

              <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                >
                  Save Offer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
