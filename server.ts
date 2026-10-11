import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { initialData } from './src/data/initialData.ts';
import { DatabaseSchema, FoodType, MenuItem } from './src/types/index.ts';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isVercel = Boolean(process.env.VERCEL);
const DATA_DIR = isVercel ? '/tmp/data' : path.resolve(process.cwd(), 'data');
const DATA_FILE = isVercel ? '/tmp/data/database.json' : path.join(DATA_DIR, 'database.json');
const UPLOADS_DIR = isVercel ? '/tmp/uploads' : path.resolve(process.cwd(), 'public', 'uploads');

// Ensure directories exist safely
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('Could not create DATA_DIR:', e);
}

try {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('Could not create UPLOADS_DIR:', e);
}

// In-memory + persistent store
let database: DatabaseSchema;

function loadDatabase(): DatabaseSchema {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        ...initialData,
        ...parsed,
        settings: { ...initialData.settings, ...(parsed.settings || {}) },
      };
    } else if (isVercel) {
      const repoDataFile = path.resolve(process.cwd(), 'data', 'database.json');
      if (fs.existsSync(repoDataFile)) {
        const raw = fs.readFileSync(repoDataFile, 'utf-8');
        const parsed = JSON.parse(raw);
        const merged = {
          ...initialData,
          ...parsed,
          settings: { ...initialData.settings, ...(parsed.settings || {}) },
        };
        try {
          if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
          fs.writeFileSync(DATA_FILE, JSON.stringify(merged, null, 2), 'utf-8');
        } catch {}
        return merged;
      }
    }
  } catch (err) {
    console.error('Error reading database file, using initial data:', err);
  }
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    saveDatabase(initialData);
  } catch {}
  return JSON.parse(JSON.stringify(initialData));
}

function saveDatabase(data: DatabaseSchema) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving database file:', err);
  }
}

database = loadDatabase();

// Middleware
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use('/uploads', express.static(UPLOADS_DIR));

// Admin authentication credentials & session management
// Defaults can be configured via ADMIN_EMAIL / ADMIN_PASSWORD in .env
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@onebitemotihari.in';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || hashPassword(process.env.ADMIN_PASSWORD || 'onebite2026!');
const activeSessions = new Set<string>();

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Auth Middleware
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: missing session token' });
  }
  const token = authHeader.split(' ')[1];
  if (!activeSessions.has(token)) {
    return res.status(401).json({ error: 'Unauthorized: invalid or expired session' });
  }
  next();
}

// --- API ROUTES ---

// 1. Bundle GET: all data at once for fast hydration
app.get('/api/data', (_req, res) => {
  res.json({
    settings: database.settings,
    categories: database.categories,
    menuItems: database.menuItems,
    gallery: database.gallery,
    reviews: database.reviews,
    offers: database.offers,
    businessHours: database.businessHours,
  });
});

// 2. Auth Endpoints
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const passHash = hashPassword(password);

  if (cleanEmail === ADMIN_EMAIL.toLowerCase() && passHash === ADMIN_PASSWORD_HASH) {
    const token = crypto.randomUUID();
    activeSessions.add(token);
    return res.json({
      success: true,
      token,
      user: { email: ADMIN_EMAIL, role: 'admin' },
    });
  }

  return res.status(401).json({ error: 'Invalid email or password' });
});

app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (activeSessions.has(token)) {
      return res.json({ authenticated: true, user: { email: ADMIN_EMAIL, role: 'admin' } });
    }
  }
  return res.status(401).json({ authenticated: false });
});

app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    activeSessions.delete(token);
  }
  res.json({ success: true });
});

// 3. Settings Endpoints
app.get('/api/settings', (_req, res) => {
  res.json(database.settings);
});

app.put('/api/settings', requireAdmin, (req, res) => {
  database.settings = {
    ...database.settings,
    ...req.body,
    updatedAt: new Date().toISOString(),
  };
  saveDatabase(database);
  res.json(database.settings);
});

// 4. Categories Endpoints
app.get('/api/categories', (_req, res) => {
  res.json(database.categories);
});

app.post('/api/categories', requireAdmin, (req, res) => {
  const { name, slug, description, displayOrder, active } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Category name is required' });
  }
  const newCat = {
    id: 'cat_' + Date.now(),
    name: name.trim(),
    slug: slug ? slug.trim() : name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    description: description || '',
    displayOrder: typeof displayOrder === 'number' ? displayOrder : database.categories.length + 1,
    active: active !== undefined ? Boolean(active) : true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  database.categories.push(newCat);
  database.categories.sort((a, b) => a.displayOrder - b.displayOrder);
  saveDatabase(database);
  res.status(201).json(newCat);
});

app.put('/api/categories/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const idx = database.categories.findIndex(c => c.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Category not found' });
  }
  database.categories[idx] = {
    ...database.categories[idx],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };
  database.categories.sort((a, b) => a.displayOrder - b.displayOrder);
  saveDatabase(database);
  res.json(database.categories[idx]);
});

app.delete('/api/categories/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  // Check if any menu item is linked
  const hasItems = database.menuItems.some(item => item.categoryId === id);
  if (hasItems) {
    return res.status(400).json({
      error: 'Cannot delete category with associated menu items. Reassign or delete those items first.',
    });
  }
  database.categories = database.categories.filter(c => c.id !== id);
  saveDatabase(database);
  res.json({ success: true });
});

// 5. Menu Items Endpoints
app.get('/api/menu-items', (_req, res) => {
  res.json(database.menuItems);
});

app.post('/api/menu-items', requireAdmin, (req, res) => {
  const {
    categoryId,
    name,
    description,
    price,
    discountPrice,
    imageUrl,
    foodType,
    popular,
    available,
    variants,
    ingredients,
    servingInfo,
    displayOrder,
  } = req.body;

  if (!name || !categoryId || price === undefined) {
    return res.status(400).json({ error: 'Name, category, and price are required' });
  }

  const newItem: MenuItem = {
    id: 'item_' + Date.now(),
    categoryId,
    name: name.trim(),
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    description: description || '',
    price: price === 'MRP' ? 'MRP' : Number(price),
    discountPrice: discountPrice ? Number(discountPrice) : null,
    imageUrl: imageUrl || 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80',
    foodType: (foodType === 'non_veg' ? 'non_veg' : 'veg') as FoodType,
    popular: Boolean(popular),
    available: available !== undefined ? Boolean(available) : true,
    variants: Array.isArray(variants) ? variants : undefined,
    ingredients: ingredients || '',
    servingInfo: servingInfo || '',
    displayOrder: typeof displayOrder === 'number' ? displayOrder : database.menuItems.length + 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  database.menuItems.push(newItem);
  database.menuItems.sort((a, b) => a.displayOrder - b.displayOrder);
  saveDatabase(database);
  res.status(201).json(newItem);
});

app.put('/api/menu-items/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const idx = database.menuItems.findIndex(i => i.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Menu item not found' });
  }
  database.menuItems[idx] = {
    ...database.menuItems[idx],
    ...req.body,
    price: req.body.price === 'MRP' ? 'MRP' : (req.body.price !== undefined ? Number(req.body.price) : database.menuItems[idx].price),
    discountPrice: req.body.discountPrice ? Number(req.body.discountPrice) : null,
    variants: req.body.variants !== undefined ? req.body.variants : database.menuItems[idx].variants,
    updatedAt: new Date().toISOString(),
  };
  database.menuItems.sort((a, b) => a.displayOrder - b.displayOrder);
  saveDatabase(database);
  res.json(database.menuItems[idx]);
});

app.delete('/api/menu-items/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  database.menuItems = database.menuItems.filter(i => i.id !== id);
  saveDatabase(database);
  res.json({ success: true });
});

app.post('/api/menu-items/:id/duplicate', requireAdmin, (req, res) => {
  const { id } = req.params;
  const item = database.menuItems.find(i => i.id === id);
  if (!item) {
    return res.status(404).json({ error: 'Menu item not found' });
  }

  const copy = {
    ...item,
    id: 'item_' + Date.now(),
    name: `${item.name} (Copy)`,
    slug: `${item.slug}-copy-${Date.now().toString().slice(-4)}`,
    displayOrder: item.displayOrder + 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  database.menuItems.push(copy);
  database.menuItems.sort((a, b) => a.displayOrder - b.displayOrder);
  saveDatabase(database);
  res.status(201).json(copy);
});

// 6. Gallery Endpoints
app.get('/api/gallery', (_req, res) => {
  res.json(database.gallery);
});

app.post('/api/gallery', requireAdmin, (req, res) => {
  const { imageUrl, category, caption, displayOrder, featured } = req.body;
  if (!imageUrl) {
    return res.status(400).json({ error: 'Image URL is required' });
  }
  const newPhoto = {
    id: 'gal_' + Date.now(),
    imageUrl,
    category: category || 'Food',
    caption: caption || '',
    displayOrder: typeof displayOrder === 'number' ? displayOrder : database.gallery.length + 1,
    featured: Boolean(featured),
    createdAt: new Date().toISOString(),
  };
  database.gallery.push(newPhoto);
  database.gallery.sort((a, b) => a.displayOrder - b.displayOrder);
  saveDatabase(database);
  res.status(201).json(newPhoto);
});

app.put('/api/gallery/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const idx = database.gallery.findIndex(g => g.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Photo not found' });
  }
  database.gallery[idx] = {
    ...database.gallery[idx],
    ...req.body,
  };
  saveDatabase(database);
  res.json(database.gallery[idx]);
});

app.delete('/api/gallery/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  database.gallery = database.gallery.filter(g => g.id !== id);
  saveDatabase(database);
  res.json({ success: true });
});

// 7. Reviews Endpoints
app.get('/api/reviews', (_req, res) => {
  res.json(database.reviews);
});

app.post('/api/reviews', requireAdmin, (req, res) => {
  const { customerName, rating, reviewText, reviewDate, featured, source } = req.body;
  if (!customerName || !reviewText) {
    return res.status(400).json({ error: 'Customer name and review text are required' });
  }
  const newReview = {
    id: 'rev_' + Date.now(),
    customerName: customerName.trim(),
    rating: Number(rating) || 5,
    reviewText: reviewText.trim(),
    reviewDate: reviewDate || 'Recent',
    featured: Boolean(featured),
    source: source || 'Verified Customer',
    createdAt: new Date().toISOString(),
  };
  database.reviews.push(newReview);
  saveDatabase(database);
  res.status(201).json(newReview);
});

app.put('/api/reviews/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const idx = database.reviews.findIndex(r => r.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Review not found' });
  }
  database.reviews[idx] = {
    ...database.reviews[idx],
    ...req.body,
  };
  saveDatabase(database);
  res.json(database.reviews[idx]);
});

app.delete('/api/reviews/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  database.reviews = database.reviews.filter(r => r.id !== id);
  saveDatabase(database);
  res.json({ success: true });
});

// 8. Offers Endpoints
app.get('/api/offers', (_req, res) => {
  res.json(database.offers);
});

app.post('/api/offers', requireAdmin, (req, res) => {
  const {
    title,
    description,
    discount,
    offerType,
    discountValue,
    targetType,
    targetCategoryIds,
    targetItemIds,
    imageUrl,
    code,
    startDate,
    endDate,
    terms,
    isPublic,
    status,
    active,
    minOrderValue,
  } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required' });
  }

  const newOffer = {
    id: 'off_' + Date.now(),
    title: title.trim(),
    description: description.trim(),
    offerType: offerType || 'percentage',
    discountValue: discountValue !== undefined && discountValue !== '' ? Number(discountValue) : undefined,
    discount: discount || (discountValue ? `${discountValue}% OFF` : 'Special Offer'),
    targetType: targetType || 'all',
    targetCategoryIds: Array.isArray(targetCategoryIds) ? targetCategoryIds : [],
    targetItemIds: Array.isArray(targetItemIds) ? targetItemIds : [],
    imageUrl: imageUrl || '',
    code: code ? code.trim().toUpperCase() : '',
    startDate: startDate || '',
    endDate: endDate || '',
    terms: terms || '',
    isPublic: isPublic !== undefined ? Boolean(isPublic) : true,
    status: status || 'active',
    active: active !== undefined ? Boolean(active) : true,
    minOrderValue: minOrderValue !== undefined && minOrderValue !== '' ? Number(minOrderValue) : undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  database.offers.push(newOffer);
  saveDatabase(database);
  res.status(201).json(newOffer);
});

app.put('/api/offers/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const idx = database.offers.findIndex(o => o.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Offer not found' });
  }
  database.offers[idx] = {
    ...database.offers[idx],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };
  saveDatabase(database);
  res.json(database.offers[idx]);
});

app.delete('/api/offers/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  database.offers = database.offers.filter(o => o.id !== id);
  saveDatabase(database);
  res.json({ success: true });
});

// 9. Business Hours Endpoints
app.get('/api/hours', (_req, res) => {
  res.json(database.businessHours);
});

app.put('/api/hours', requireAdmin, (req, res) => {
  if (Array.isArray(req.body)) {
    database.businessHours = req.body;
    saveDatabase(database);
    return res.json(database.businessHours);
  }
  return res.status(400).json({ error: 'Expected array of business hours' });
});

// 9.5 Orders Endpoints
app.get('/api/orders', (_req, res) => {
  res.json(database.orders || []);
});

app.post('/api/orders', (req, res) => {
  const { customerName, customerPhone, orderType, deliveryAddress, tableNumber, notes, items, subtotal, addonsTotal, totalAmount } = req.body;
  if (!customerName || !customerPhone || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Customer name, phone and at least one item are required' });
  }

  if (!database.orders) {
    database.orders = [];
  }

  const newOrder = {
    id: 'ord_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    customerName: customerName.trim(),
    customerPhone: customerPhone.trim(),
    orderType: orderType || 'takeaway',
    deliveryAddress: deliveryAddress || '',
    tableNumber: tableNumber || '',
    notes: notes || '',
    items,
    subtotal: Number(subtotal) || 0,
    addonsTotal: Number(addonsTotal) || 0,
    totalAmount: Number(totalAmount) || 0,
    status: 'pending' as const,
    createdAt: new Date().toISOString(),
  };

  database.orders.unshift(newOrder);
  saveDatabase(database);
  res.status(201).json(newOrder);
});

app.put('/api/orders/:id/status', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!database.orders) database.orders = [];
  const order = database.orders.find(o => o.id === id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  order.status = status;
  saveDatabase(database);
  res.json(order);
});

// 10. Image Upload Endpoint
app.post('/api/upload', requireAdmin, (req, res) => {
  try {
    const { data, filename } = req.body;
    if (!data) {
      return res.status(400).json({ error: 'Image data or URL is required' });
    }

    // If it is already a web URL, return it directly
    if (data.startsWith('http://') || data.startsWith('https://')) {
      return res.json({ url: data });
    }

    // Handle base64 upload
    const matches = data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Invalid base64 image data' });
    }

    const ext = matches[1].split('/')[1] || 'jpg';
    const buffer = Buffer.from(matches[2], 'base64');
    const safeFilename = `img_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, safeFilename);

    fs.writeFileSync(filePath, buffer);
    const publicUrl = `/uploads/${safeFilename}`;

    return res.json({ url: publicUrl });
  } catch (err: any) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: 'Failed to process image upload' });
  }
});

// 11. Reset data to factory defaults
app.post('/api/reset-data', requireAdmin, (_req, res) => {
  database = JSON.parse(JSON.stringify(initialData));
  saveDatabase(database);
  res.json({ success: true, message: 'Database reset to initial restaurant configuration' });
});

// Start Server and mount Vite / Static files
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`> One Bite Motihari Server running at http://0.0.0.0:${PORT}`);
  });
}

export default app;

if (!process.env.VERCEL) {
  startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}
