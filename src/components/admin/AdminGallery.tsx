import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext.tsx';
import { GalleryItem } from '../../types/index.ts';
import { useToast } from '../common/Toast.tsx';
import { Plus, Trash2, Edit2, Upload, Sparkles, X, Check } from 'lucide-react';

export function AdminGallery() {
  const { gallery, saveGalleryItem, deleteGalleryItem, uploadImage } = useRestaurant();
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<Partial<GalleryItem> | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const categories: GalleryItem['category'][] = ['Food', 'Interior', 'Exterior', 'Ambience', 'Other'];

  const handleOpenAdd = () => {
    setEditingPhoto({
      imageUrl: '',
      category: 'Food',
      caption: '',
      displayOrder: gallery.length + 1,
      featured: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (photo: GalleryItem) => {
    setEditingPhoto({ ...photo });
    setIsModalOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file', 'error');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const uploadedUrl = await uploadImage(base64, file.name);
        setEditingPhoto(prev => (prev ? { ...prev, imageUrl: uploadedUrl } : null));
        showToast('Photo uploaded successfully!', 'success');
      } catch (err: any) {
        showToast(err?.message || 'Failed to upload photo', 'error');
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPhoto?.imageUrl) {
      showToast('Please provide an image URL or upload a photo', 'error');
      return;
    }

    try {
      await saveGalleryItem(editingPhoto);
      showToast(editingPhoto.id ? 'Photo details updated!' : 'New photo added to gallery!', 'success');
      setIsModalOpen(false);
      setEditingPhoto(null);
    } catch (err: any) {
      showToast(err?.message || 'Failed to save photo', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteGalleryItem(id);
      showToast('Photo deleted from gallery.', 'info');
      setDeleteId(null);
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete photo', 'error');
    }
  };

  const handleToggleFeatured = async (photo: GalleryItem) => {
    try {
      await saveGalleryItem({ ...photo, featured: !photo.featured });
      showToast(`Photo "${photo.caption || photo.category}" featured status updated!`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to update photo', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900">Gallery Management</h1>
          <p className="text-xs sm:text-sm text-stone-500">
            Showcase your food, cozy interior, ambience, and Motihari outlet photos.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Photo</span>
        </button>
      </div>

      {/* Grid of Photos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {gallery.map(photo => (
          <div
            key={photo.id}
            className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs flex flex-col group"
          >
            <div className="relative aspect-4/3 bg-stone-100 overflow-hidden">
              <img
                src={photo.imageUrl}
                alt={photo.caption || 'Restaurant gallery image'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />

              <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                <span className="bg-stone-900/80 backdrop-blur-xs text-white text-[11px] font-bold px-2 py-0.5 rounded-md">
                  {photo.category}
                </span>
                {photo.featured && (
                  <span className="bg-amber-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Featured
                  </span>
                )}
              </div>
            </div>

            <div className="p-4 flex-1 flex flex-col justify-between">
              <p className="text-xs text-stone-600 mb-3 line-clamp-2 italic">
                {photo.caption || 'No caption provided'}
              </p>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                <button
                  onClick={() => handleToggleFeatured(photo)}
                  className={`text-xs font-semibold px-2 py-1 rounded-md transition-colors ${
                    photo.featured
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                  }`}
                  title="Toggle featured image"
                >
                  {photo.featured ? 'Featured' : 'Standard'}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(photo)}
                    className="p-1.5 rounded-lg text-amber-700 hover:text-amber-900 hover:bg-amber-50"
                    title="Edit photo"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setDeleteId(photo.id)}
                    className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50"
                    title="Delete photo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation */}
      {deleteId && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-stone-200">
            <h3 className="text-lg font-bold text-stone-900 mb-2">Delete Gallery Photo?</h3>
            <p className="text-xs sm:text-sm text-stone-600 mb-6">
              This photo will be removed from the public website gallery.
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
                Delete Photo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Photo Modal */}
      {isModalOpen && editingPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-stone-900">
                {editingPhoto.id ? 'Edit Photo' : 'Add Photo to Gallery'}
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
                  Image Source *
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={editingPhoto.imageUrl || ''}
                    onChange={e => setEditingPhoto({ ...editingPhoto, imageUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 px-3.5 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                  />
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl cursor-pointer">
                    <Upload className="w-4 h-4" />
                    <span>{isUploading ? '...' : 'Upload'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                    />
                  </label>
                </div>

                {editingPhoto.imageUrl && (
                  <div className="mt-3">
                    <img
                      src={editingPhoto.imageUrl}
                      alt="Preview"
                      className="w-full h-40 object-cover rounded-xl border border-stone-200"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Category *
                </label>
                <select
                  value={editingPhoto.category || 'Food'}
                  onChange={e =>
                    setEditingPhoto({
                      ...editingPhoto,
                      category: e.target.value as GalleryItem['category'],
                    })
                  }
                  className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none bg-white"
                >
                  {categories.map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Caption / Description
                </label>
                <input
                  type="text"
                  value={editingPhoto.caption || ''}
                  onChange={e => setEditingPhoto({ ...editingPhoto, caption: e.target.value })}
                  placeholder="e.g. Freshly baked Farm Fresh Pizza at One Bite Motihari"
                  className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-800">
                  <input
                    type="checkbox"
                    checked={editingPhoto.featured || false}
                    onChange={e => setEditingPhoto({ ...editingPhoto, featured: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-600"
                  />
                  <span>Mark as Featured Photo</span>
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
                  Save Photo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
