import { DatabaseSchema, SiteSettings, Category, MenuItem, GalleryItem, ReviewItem, OfferItem, BusinessDayHours, CustomerOrder } from '../types/index.ts';
import { initialData } from '../data/initialData.ts';

const TOKEN_KEY = 'onebite_admin_token';

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY) || '',
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clearToken: () => localStorage.removeItem(TOKEN_KEY),
};

const getAuthHeaders = (): Record<string, string> => {
  const token = authStorage.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const api = {
  async getData(): Promise<DatabaseSchema> {
    try {
      const res = await fetch('/api/data');
      if (!res.ok) throw new Error('Failed to fetch data');
      return await res.json();
    } catch (err) {
      console.warn('API fetch failed, falling back to local snapshot:', err);
      return initialData;
    }
  },

  async login(email: string, pass: string): Promise<{ token: string; user: { email: string; role: string } }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Login failed' }));
      throw new Error(err.error || 'Invalid credentials');
    }
    const data = await res.json();
    authStorage.setToken(data.token);
    return data;
  },

  async checkAuth(): Promise<boolean> {
    const token = authStorage.getToken();
    if (!token) return false;
    try {
      const res = await fetch('/api/auth/me', {
        headers: getAuthHeaders(),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
    } catch {}
    authStorage.clearToken();
  },

  async updateSettings(settings: Partial<SiteSettings>): Promise<SiteSettings> {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(settings),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update settings' }));
      throw new Error(err.error || 'Failed to update settings');
    }
    return await res.json();
  },

  async createCategory(category: Partial<Category>): Promise<Category> {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(category),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to create category' }));
      throw new Error(err.error || 'Failed to create category');
    }
    return await res.json();
  },

  async updateCategory(id: string, category: Partial<Category>): Promise<Category> {
    const res = await fetch(`/api/categories/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(category),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update category' }));
      throw new Error(err.error || 'Failed to update category');
    }
    return await res.json();
  },

  async deleteCategory(id: string): Promise<void> {
    const res = await fetch(`/api/categories/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to delete category' }));
      throw new Error(err.error || 'Failed to delete category');
    }
  },

  async createMenuItem(item: Partial<MenuItem>): Promise<MenuItem> {
    const res = await fetch('/api/menu-items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(item),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to create item' }));
      throw new Error(err.error || 'Failed to create item');
    }
    return await res.json();
  },

  async updateMenuItem(id: string, item: Partial<MenuItem>): Promise<MenuItem> {
    const res = await fetch(`/api/menu-items/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(item),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update item' }));
      throw new Error(err.error || 'Failed to update item');
    }
    return await res.json();
  },

  async deleteMenuItem(id: string): Promise<void> {
    const res = await fetch(`/api/menu-items/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to delete item' }));
      throw new Error(err.error || 'Failed to delete item');
    }
  },

  async duplicateMenuItem(id: string): Promise<MenuItem> {
    const res = await fetch(`/api/menu-items/${id}/duplicate`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to duplicate item' }));
      throw new Error(err.error || 'Failed to duplicate item');
    }
    return await res.json();
  },

  async createGalleryItem(photo: Partial<GalleryItem>): Promise<GalleryItem> {
    const res = await fetch('/api/gallery', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(photo),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to add photo' }));
      throw new Error(err.error || 'Failed to add photo');
    }
    return await res.json();
  },

  async updateGalleryItem(id: string, photo: Partial<GalleryItem>): Promise<GalleryItem> {
    const res = await fetch(`/api/gallery/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(photo),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update photo' }));
      throw new Error(err.error || 'Failed to update photo');
    }
    return await res.json();
  },

  async deleteGalleryItem(id: string): Promise<void> {
    const res = await fetch(`/api/gallery/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to delete photo' }));
      throw new Error(err.error || 'Failed to delete photo');
    }
  },

  async createReview(review: Partial<ReviewItem>): Promise<ReviewItem> {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(review),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to add review' }));
      throw new Error(err.error || 'Failed to add review');
    }
    return await res.json();
  },

  async updateReview(id: string, review: Partial<ReviewItem>): Promise<ReviewItem> {
    const res = await fetch(`/api/reviews/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(review),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update review' }));
      throw new Error(err.error || 'Failed to update review');
    }
    return await res.json();
  },

  async deleteReview(id: string): Promise<void> {
    const res = await fetch(`/api/reviews/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to delete review' }));
      throw new Error(err.error || 'Failed to delete review');
    }
  },

  async createOffer(offer: Partial<OfferItem>): Promise<OfferItem> {
    const res = await fetch('/api/offers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(offer),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to create offer' }));
      throw new Error(err.error || 'Failed to create offer');
    }
    return await res.json();
  },

  async updateOffer(id: string, offer: Partial<OfferItem>): Promise<OfferItem> {
    const res = await fetch(`/api/offers/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(offer),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update offer' }));
      throw new Error(err.error || 'Failed to update offer');
    }
    return await res.json();
  },

  async deleteOffer(id: string): Promise<void> {
    const res = await fetch(`/api/offers/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to delete offer' }));
      throw new Error(err.error || 'Failed to delete offer');
    }
  },

  async createOrder(orderData: Partial<CustomerOrder>): Promise<CustomerOrder> {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to place order' }));
      throw new Error(err.error || 'Failed to place order');
    }
    return await res.json();
  },

  async getOrders(): Promise<CustomerOrder[]> {
    const res = await fetch('/api/orders', {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return [];
    return await res.json();
  },

  async updateOrderStatus(id: string, status: CustomerOrder['status']): Promise<CustomerOrder> {
    const res = await fetch(`/api/orders/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      throw new Error('Failed to update order status');
    }
    return await res.json();
  },

  async updateBusinessHours(hours: BusinessDayHours[]): Promise<BusinessDayHours[]> {
    const res = await fetch('/api/hours', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(hours),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update hours' }));
      throw new Error(err.error || 'Failed to update hours');
    }
    return await res.json();
  },

  async uploadImage(base64OrUrl: string, filename?: string): Promise<string> {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ data: base64OrUrl, filename }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(err.error || 'Upload failed');
    }
    const data = await res.json();
    return data.url;
  },

  async saveCategory(category: Partial<Category>): Promise<Category> {
    if (category.id) {
      return this.updateCategory(category.id, category);
    }
    return this.createCategory(category);
  },

  async saveMenuItem(item: Partial<MenuItem>): Promise<MenuItem> {
    if (item.id) {
      return this.updateMenuItem(item.id, item);
    }
    return this.createMenuItem(item);
  },

  async saveGalleryItem(photo: Partial<GalleryItem>): Promise<GalleryItem> {
    if (photo.id) {
      return this.updateGalleryItem(photo.id, photo);
    }
    return this.createGalleryItem(photo);
  },

  async saveReview(review: Partial<ReviewItem>): Promise<ReviewItem> {
    if (review.id) {
      return this.updateReview(review.id, review);
    }
    return this.createReview(review);
  },

  async saveOffer(offer: Partial<OfferItem>): Promise<OfferItem> {
    if (offer.id) {
      return this.updateOffer(offer.id, offer);
    }
    return this.createOffer(offer);
  },

  async resetData(): Promise<void> {
    const res = await fetch('/api/reset-data', {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      throw new Error('Failed to reset data');
    }
  },
};
