import React, { useState, useMemo } from 'react';
import { useRestaurant } from '../../context/RestaurantContext.tsx';
import { MenuItem, Category, FoodType, MenuVariant } from '../../types/index.ts';
import { useToast } from '../common/Toast.tsx';
import { FoodTypeBadge } from '../common/FoodTypeBadge.tsx';
import { Plus, Search, Edit2, Trash2, Copy, Flame, Check, X, Upload, ArrowUp, ArrowDown, SlidersHorizontal } from 'lucide-react';

export function AdminMenu() {
  const { menuItems, categories, saveMenuItem, deleteMenuItem, duplicateMenuItem, uploadImage } = useRestaurant();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [editingItem, setEditingItem] = useState<Partial<MenuItem> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // New variant inputs within modal
  const [newVarName, setNewVarName] = useState('');
  const [newVarPrice, setNewVarPrice] = useState<number | string>('');

  // Filtered menu
  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      if (selectedCat !== 'all' && item.categoryId !== selectedCat) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
      }
      return true;
    }).sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }, [menuItems, selectedCat, searchQuery]);

  const handleOpenAdd = () => {
    setEditingItem({
      categoryId: categories[0]?.id || '',
      name: '',
      description: '',
      price: 99,
      discountPrice: null,
      imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80',
      foodType: 'veg',
      popular: false,
      available: true,
      variants: [],
      ingredients: '',
      servingInfo: '',
      displayOrder: menuItems.length + 1,
    });
    setNewVarName('');
    setNewVarPrice('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: MenuItem) => {
    setEditingItem({
      ...item,
      variants: item.variants ? [...item.variants] : [],
    });
    setNewVarName('');
    setNewVarPrice('');
    setIsModalOpen(true);
  };

  const handleDuplicate = async (id: string) => {
    try {
      const duplicated = await duplicateMenuItem(id);
      showToast(`Duplicated "${duplicated.name}" successfully!`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to duplicate item', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMenuItem(id);
      showToast('Menu item deleted.', 'info');
      setIsDeletingId(null);
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete item', 'error');
    }
  };

  const handleTogglePopular = async (item: MenuItem) => {
    try {
      await saveMenuItem({ ...item, popular: !item.popular });
      showToast(`"${item.name}" popular status updated!`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to update status', 'error');
    }
  };

  const handleToggleAvailable = async (item: MenuItem) => {
    try {
      await saveMenuItem({ ...item, available: !item.available });
      showToast(`"${item.name}" availability updated!`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to update availability', 'error');
    }
  };

  const handleMoveOrder = async (item: MenuItem, direction: 'up' | 'down') => {
    const currentOrder = item.displayOrder ?? 0;
    const newOrder = direction === 'up' ? Math.max(1, currentOrder - 1) : currentOrder + 1;
    try {
      await saveMenuItem({ ...item, displayOrder: newOrder });
      showToast(`Reordered "${item.name}"`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to reorder', 'error');
    }
  };

  const handleAddVariant = () => {
    if (!newVarName.trim() || newVarPrice === '') {
      showToast('Please enter both variant name and price', 'error');
      return;
    }

    const priceNum = newVarPrice === 'MRP' ? 'MRP' : Number(newVarPrice);
    const newVar: MenuVariant = {
      id: `v_${Date.now()}`,
      name: newVarName.trim(),
      price: priceNum,
      available: true,
    };

    setEditingItem(prev => {
      if (!prev) return null;
      return {
        ...prev,
        variants: [...(prev.variants || []), newVar],
      };
    });

    setNewVarName('');
    setNewVarPrice('');
  };

  const handleRemoveVariant = (variantId: string) => {
    setEditingItem(prev => {
      if (!prev) return null;
      return {
        ...prev,
        variants: (prev.variants || []).filter(v => v.id !== variantId),
      };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem?.name || !editingItem?.categoryId || editingItem.price === undefined) {
      showToast('Please fill in required fields (Name, Category, Price)', 'error');
      return;
    }

    try {
      await saveMenuItem(editingItem);
      showToast(editingItem.id ? 'Item updated successfully!' : 'Item created successfully!', 'success');
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (err: any) {
      showToast(err?.message || 'Failed to save menu item', 'error');
    }
  };

  // Image file upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WebP)', 'error');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const uploadedUrl = await uploadImage(base64, file.name);
        setEditingItem(prev => (prev ? { ...prev, imageUrl: uploadedUrl } : null));
        showToast('Image uploaded successfully!', 'success');
      } catch (err: any) {
        showToast(err?.message || 'Failed to upload image', 'error');
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900">Menu Management</h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Manage all 16 official menu categories, dish variants, pricing, availability, and ordering.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-xs sm:text-sm py-2.5 px-4 rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Menu Item</span>
        </button>
      </div>

      {/* Filter and Search controls */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search dish or ingredients..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedCat('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedCat === 'all'
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            All Categories ({menuItems.length})
          </button>
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCat(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCat === c.id
                  ? 'bg-amber-600 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/75 text-stone-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Dish</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Price / Sizes</th>
                <th className="py-3 px-4">Diet</th>
                <th className="py-3 px-4">Popular</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredItems.map(item => {
                const catName = categories.find(c => c.id === item.categoryId)?.name || 'Unknown';
                const hasVariants = Boolean(item.variants && item.variants.length > 0);
                return (
                  <tr key={item.id} className="hover:bg-stone-50/70 transition-colors">
                    {/* Item Info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-12 h-12 rounded-xl object-cover shrink-0 bg-stone-100"
                        />
                        <div className="min-w-0 max-w-[200px] sm:max-w-[260px]">
                          <div className="font-bold text-stone-900 truncate">{item.name}</div>
                          <div className="text-[11px] text-stone-500 truncate">{item.description}</div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 font-medium text-stone-700 whitespace-nowrap">
                      {catName}
                    </td>

                    {/* Price & Variants */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-extrabold text-stone-900">
                        {item.price === 'MRP' ? 'MRP' : `₹${item.price}`}
                      </div>
                      {hasVariants && (
                        <div className="text-[11px] font-semibold text-amber-700 mt-0.5">
                          {item.variants?.length} sizes ({item.variants?.map(v => v.name).join(', ')})
                        </div>
                      )}
                    </td>

                    {/* Veg/Non-Veg */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <FoodTypeBadge type={item.foodType} showText />
                    </td>

                    {/* Popular toggle */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        onClick={() => handleTogglePopular(item)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          item.popular
                            ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                            : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                        }`}
                        title="Click to toggle popular picks"
                      >
                        <Flame className={`w-3.5 h-3.5 ${item.popular ? 'fill-amber-600 text-amber-600' : ''}`} />
                        <span>{item.popular ? 'Popular' : 'Standard'}</span>
                      </button>
                    </td>

                    {/* Availability toggle */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleAvailable(item)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          item.available
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                        }`}
                        title="Click to toggle availability"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${item.available ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                        <span>{item.available ? 'In Stock' : 'Sold Out'}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handleMoveOrder(item, 'up')}
                          className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveOrder(item, 'down')}
                          className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDuplicate(item.id)}
                          className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
                          title="Duplicate dish"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded-lg text-amber-700 hover:text-amber-900 hover:bg-amber-50 transition-colors cursor-pointer"
                          title="Edit dish"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setIsDeletingId(item.id)}
                          className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete dish"
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
      </div>

      {/* Delete Confirmation Modal */}
      {isDeletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-stone-200">
            <h3 className="text-base font-bold text-stone-900">Confirm Deletion</h3>
            <p className="text-xs sm:text-sm text-stone-600">
              Are you sure you want to delete this menu item? This action will remove it permanently.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsDeletingId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(isDeletingId)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit / Add Modal */}
      {isModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-2xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-stone-900 text-white">
              <h2 className="text-base font-bold text-white">
                {editingItem.id ? 'Edit Menu Item' : 'Add New Menu Item'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSave} className="overflow-y-auto p-6 space-y-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Dish Name */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Dish Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingItem.name || ''}
                    onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                    placeholder="e.g. OB Chicken Amazing"
                    className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    required
                    value={editingItem.categoryId || ''}
                    onChange={e => setEditingItem({ ...editingItem, categoryId: e.target.value })}
                    className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 bg-white"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price & Dietary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Base Price (₹ or MRP) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingItem.price ?? ''}
                    onChange={e => {
                      const val = e.target.value;
                      setEditingItem({
                        ...editingItem,
                        price: val.toUpperCase() === 'MRP' ? 'MRP' : Number(val) || 0,
                      });
                    }}
                    placeholder="e.g. 120 or MRP"
                    className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Discount Price (Optional)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editingItem.discountPrice ?? ''}
                    onChange={e =>
                      setEditingItem({
                        ...editingItem,
                        discountPrice: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    placeholder="e.g. 99"
                    className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Dietary
                  </label>
                  <select
                    value={editingItem.foodType || 'veg'}
                    onChange={e => setEditingItem({ ...editingItem, foodType: e.target.value as FoodType })}
                    className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 bg-white"
                  >
                    <option value="veg">Pure Veg (Green Dot)</option>
                    <option value="non_veg">Non-Veg (Brown Triangle)</option>
                  </select>
                </div>
              </div>

              {/* Sizes / Variants Management */}
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/90 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold text-stone-900 uppercase tracking-wider">
                      Sizes & Variants (e.g. Small / Large, Single / Double, 2 / 5 / 9 pcs)
                    </label>
                    <span className="text-[11px] text-stone-500">
                      If configured, customers choose size before adding to cart.
                    </span>
                  </div>
                </div>

                {/* Existing variants */}
                {editingItem.variants && editingItem.variants.length > 0 && (
                  <div className="space-y-2">
                    {editingItem.variants.map(v => (
                      <div
                        key={v.id}
                        className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-stone-200 text-xs"
                      >
                        <span className="font-bold text-stone-800">{v.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-extrabold text-amber-700">₹{v.price}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveVariant(v.id)}
                            className="text-stone-400 hover:text-rose-600"
                            title="Remove size"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new variant row */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Size name (e.g. Small (S) or 5 pcs)"
                    value={newVarName}
                    onChange={e => setNewVarName(e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-stone-200 rounded-xl text-xs focus:outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Price (₹)"
                    value={newVarPrice}
                    onChange={e => setNewVarPrice(e.target.value)}
                    className="w-24 px-3 py-1.5 border border-stone-200 rounded-xl text-xs focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl whitespace-nowrap cursor-pointer"
                  >
                    + Add Size
                  </button>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={editingItem.description || ''}
                  onChange={e => setEditingItem({ ...editingItem, description: e.target.value })}
                  placeholder="Appetizing description of ingredients and flavors..."
                  className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
              </div>

              {/* Image URL & File Upload */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Food Photo URL or Upload
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={editingItem.imageUrl || ''}
                    onChange={e => setEditingItem({ ...editingItem, imageUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 px-3.5 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                  />
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl cursor-pointer">
                    <Upload className="w-4 h-4" />
                    <span>{isUploading ? 'Uploading...' : 'Upload'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                    />
                  </label>
                </div>
                {editingItem.imageUrl && (
                  <div className="mt-2 flex items-center gap-3">
                    <img
                      src={editingItem.imageUrl}
                      alt="Preview"
                      className="w-14 h-14 rounded-lg object-cover border border-stone-200"
                    />
                    <span className="text-xs text-stone-500">Image preview</span>
                  </div>
                )}
              </div>

              {/* Ingredients & Serving Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Ingredients List (Optional)
                  </label>
                  <input
                    type="text"
                    value={editingItem.ingredients || ''}
                    onChange={e => setEditingItem({ ...editingItem, ingredients: e.target.value })}
                    placeholder="e.g. Patty, mozzarella, herb mayo, sesame bun"
                    className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Serving Portion (Optional)
                  </label>
                  <input
                    type="text"
                    value={editingItem.servingInfo || ''}
                    onChange={e => setEditingItem({ ...editingItem, servingInfo: e.target.value })}
                    placeholder="e.g. Available in Small (S) & Large (L)"
                    className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none"
                  />
                </div>
              </div>

              {/* Toggles: Popular, Available, Display order */}
              <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-800">
                  <input
                    type="checkbox"
                    checked={editingItem.popular || false}
                    onChange={e => setEditingItem({ ...editingItem, popular: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Mark as Popular Pick</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-800">
                  <input
                    type="checkbox"
                    checked={editingItem.available !== false}
                    onChange={e => setEditingItem({ ...editingItem, available: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Available (In Stock)</span>
                </label>

                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-xs text-stone-500 font-medium">Display Order:</span>
                  <input
                    type="number"
                    value={editingItem.displayOrder ?? 1}
                    onChange={e => setEditingItem({ ...editingItem, displayOrder: Number(e.target.value) })}
                    className="w-16 px-2 py-1 border border-stone-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs cursor-pointer"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
