import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext.tsx';
import { Category } from '../../types/index.ts';
import { useToast } from '../common/Toast.tsx';
import { Plus, Edit2, Trash2, Check, X, AlertTriangle, ArrowUpDown } from 'lucide-react';

export function AdminCategories() {
  const { categories, menuItems, saveCategory, deleteCategory } = useRestaurant();
  const { showToast } = useToast();

  const [editingCat, setEditingCat] = useState<Partial<Category> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleOpenAdd = () => {
    setEditingCat({
      name: '',
      description: '',
      displayOrder: categories.length + 1,
      active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCat({ ...cat });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCat?.name) {
      showToast('Category name is required', 'error');
      return;
    }
    try {
      await saveCategory(editingCat);
      showToast(editingCat.id ? 'Category updated!' : 'Category created!', 'success');
      setIsModalOpen(false);
      setEditingCat(null);
    } catch (err: any) {
      showToast(err?.message || 'Failed to save category', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    // Check dependent items
    const count = menuItems.filter(i => i.categoryId === id).length;
    if (count > 0) {
      showToast(
        `Cannot delete this category: ${count} menu item(s) are assigned to it. Reassign or delete those items first.`,
        'error'
      );
      setDeleteId(null);
      return;
    }

    try {
      await deleteCategory(id);
      showToast('Category deleted successfully.', 'info');
      setDeleteId(null);
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete category', 'error');
    }
  };

  const handleToggleActive = async (cat: Category) => {
    try {
      await saveCategory({ ...cat, active: !cat.active });
      showToast(`Category "${cat.name}" status updated!`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to update category', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900">Category Management</h1>
          <p className="text-xs sm:text-sm text-stone-500">
            Create and organize menu categories such as Burgers, Pizzas, Shakes, and Sides.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Category</span>
        </button>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 uppercase text-[11px] font-bold tracking-wider">
              <th className="py-3 px-4">Order</th>
              <th className="py-3 px-4">Category Name</th>
              <th className="py-3 px-4">Description</th>
              <th className="py-3 px-4">Linked Items</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {categories.map(cat => {
              const itemCount = menuItems.filter(i => i.categoryId === cat.id).length;
              return (
                <tr key={cat.id} className="hover:bg-stone-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-semibold text-stone-500">
                    #{cat.displayOrder}
                  </td>

                  <td className="py-3.5 px-4 font-bold text-stone-900">
                    {cat.name}
                  </td>

                  <td className="py-3.5 px-4 text-stone-500 max-w-xs truncate">
                    {cat.description || '—'}
                  </td>

                  <td className="py-3.5 px-4 font-semibold text-stone-700">
                    {itemCount} {itemCount === 1 ? 'item' : 'items'}
                  </td>

                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => handleToggleActive(cat)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                        cat.active
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-stone-100 text-stone-500'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${cat.active ? 'bg-emerald-600' : 'bg-stone-400'}`} />
                      <span>{cat.active ? 'Active' : 'Hidden'}</span>
                    </button>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(cat)}
                        className="p-1.5 rounded-lg text-amber-700 hover:text-amber-900 hover:bg-amber-50 cursor-pointer"
                        title="Edit category"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setDeleteId(cat.id)}
                        className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 cursor-pointer"
                        title="Delete category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation */}
      {deleteId && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-stone-200">
            <h3 className="text-lg font-bold text-stone-900 mb-2">Delete Category?</h3>
            <p className="text-xs sm:text-sm text-stone-600 mb-6">
              Are you sure? Categories with active menu items cannot be deleted to prevent broken menu items.
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
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Category Modal */}
      {isModalOpen && editingCat && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-stone-900">
                {editingCat.id ? 'Edit Category' : 'Add Category'}
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
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={editingCat.name || ''}
                  onChange={e => setEditingCat({ ...editingCat, name: e.target.value })}
                  placeholder="e.g. Burgers, Pizzas, Shakes"
                  className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={editingCat.description || ''}
                  onChange={e => setEditingCat({ ...editingCat, description: e.target.value })}
                  placeholder="Short tagline for this menu category..."
                  className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={editingCat.displayOrder ?? 1}
                    onChange={e => setEditingCat({ ...editingCat, displayOrder: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none"
                  />
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-800">
                    <input
                      type="checkbox"
                      checked={editingCat.active !== false}
                      onChange={e => setEditingCat({ ...editingCat, active: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-600"
                    />
                    <span>Active on Menu</span>
                  </label>
                </div>
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
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
