import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext.tsx';
import { ReviewItem } from '../../types/index.ts';
import { useToast } from '../common/Toast.tsx';
import { Plus, Trash2, Edit2, Star, Sparkles, X } from 'lucide-react';

export function AdminReviews() {
  const { reviews, saveReview, deleteReview } = useRestaurant();
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Partial<ReviewItem> | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleOpenAdd = () => {
    setEditingReview({
      customerName: '',
      rating: 5,
      reviewText: '',
      reviewDate: 'Recent',
      source: 'Google Review',
      featured: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rev: ReviewItem) => {
    setEditingReview({ ...rev });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReview?.customerName || !editingReview?.reviewText) {
      showToast('Please provide customer name and review text', 'error');
      return;
    }

    try {
      await saveReview(editingReview);
      showToast(editingReview.id ? 'Review updated!' : 'Review added!', 'success');
      setIsModalOpen(false);
      setEditingReview(null);
    } catch (err: any) {
      showToast(err?.message || 'Failed to save review', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteReview(id);
      showToast('Review removed.', 'info');
      setDeleteId(null);
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete review', 'error');
    }
  };

  const handleToggleFeatured = async (rev: ReviewItem) => {
    try {
      await saveReview({ ...rev, featured: !rev.featured });
      showToast(`Review featured state updated!`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to update review', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900">Customer Reviews Management</h1>
          <p className="text-xs sm:text-sm text-stone-500">
            Manage genuine customer reviews displayed on your website and Google reviews references.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Review</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {reviews.map(rev => (
          <div
            key={rev.id}
            className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= rev.rating ? 'text-amber-500 fill-amber-500' : 'text-stone-300'
                      }`}
                    />
                  ))}
                </div>

                {rev.featured && (
                  <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Featured
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-stone-700 italic leading-relaxed mb-4">
                "{rev.reviewText}"
              </p>
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
              <div>
                <div className="font-bold text-stone-900 text-xs sm:text-sm">{rev.customerName}</div>
                <div className="text-[11px] text-stone-600">
                  {rev.source} · {rev.reviewDate}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleToggleFeatured(rev)}
                  className={`text-[11px] font-semibold px-2 py-1 rounded transition-colors ${
                    rev.featured ? 'bg-amber-100 text-amber-800' : 'bg-stone-100 text-stone-500'
                  }`}
                  title="Toggle featured status"
                >
                  {rev.featured ? 'Active' : 'Show'}
                </button>

                <button
                  onClick={() => handleOpenEdit(rev)}
                  className="p-1.5 rounded-lg text-amber-700 hover:text-amber-900 hover:bg-amber-50"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setDeleteId(rev.id)}
                  className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
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
            <h3 className="text-lg font-bold text-stone-900 mb-2">Delete Review?</h3>
            <p className="text-xs sm:text-sm text-stone-600 mb-6">
              This review will be permanently removed from your website.
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
                Delete Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Review Modal */}
      {isModalOpen && editingReview && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-stone-900">
                {editingReview.id ? 'Edit Review' : 'Add Customer Review'}
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
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={editingReview.customerName || ''}
                  onChange={e => setEditingReview({ ...editingReview, customerName: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Rating (1 to 5 Stars) *
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setEditingReview({ ...editingReview, rating: num })}
                      className="p-1"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          num <= (editingReview.rating || 5)
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-stone-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-stone-700 ml-2">
                    {editingReview.rating || 5} / 5 Stars
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Review Text *
                </label>
                <textarea
                  rows={3}
                  required
                  value={editingReview.reviewText || ''}
                  onChange={e => setEditingReview({ ...editingReview, reviewText: e.target.value })}
                  placeholder="Genuine feedback about food quality, taste, or service..."
                  className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Date / Month
                  </label>
                  <input
                    type="text"
                    value={editingReview.reviewDate || ''}
                    onChange={e => setEditingReview({ ...editingReview, reviewDate: e.target.value })}
                    placeholder="e.g. October 2026"
                    className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Source
                  </label>
                  <input
                    type="text"
                    value={editingReview.source || ''}
                    onChange={e => setEditingReview({ ...editingReview, source: e.target.value })}
                    placeholder="e.g. Google Review"
                    className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-800">
                  <input
                    type="checkbox"
                    checked={editingReview.featured !== false}
                    onChange={e => setEditingReview({ ...editingReview, featured: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-600"
                  />
                  <span>Feature on Homepage</span>
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
                  Save Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
