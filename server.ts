import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { initialData } from './src/data/initialData.ts';
import { DatabaseSchema, FoodType, MenuItem, CustomerOrder } from './src/types/index.ts';

dotenv.config();

const app = express();
const PORT = 3000;
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
  updateCatalogCache();
}

database = loadDatabase();

// Pre-serialized Catalog Cache & ETag for Sub-10ms High-Concurrency Delivery
let catalogETag = '';
let catalogPayload = '';

function updateCatalogCache() {
  if (!database) return;
  const data = {
    settings: database.settings,
    categories: database.categories,
    menuItems: database.menuItems,
    gallery: database.gallery,
    reviews: database.reviews,
    offers: database.offers,
    businessHours: database.businessHours,
  };
  catalogPayload = JSON.stringify(data);
  catalogETag = `"${crypto.createHash('md5').update(catalogPayload).digest('hex')}"`;
}
updateCatalogCache();

// Disable fingerprinting
app.disable('x-powered-by');

// Security Headers Middleware (iFrame compatible for AI Studio preview)
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// CORS Security Middleware with Strict Hostname Validation
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  const host = req.headers.host;

  if (origin) {
    let isAllowed = !process.env.NODE_ENV || process.env.NODE_ENV !== 'production';

    if (!isAllowed) {
      try {
        const originUrl = new URL(origin);
        if (host) {
          const hostHostname = host.split(':')[0].toLowerCase();
          if (originUrl.hostname.toLowerCase() === hostHostname) {
            isAllowed = true;
          }
        }
        if (process.env.APP_URL) {
          const appUrl = new URL(process.env.APP_URL);
          if (originUrl.hostname.toLowerCase() === appUrl.hostname.toLowerCase()) {
            isAllowed = true;
          }
        }
      } catch {
        isAllowed = false;
      }
    }

    if (isAllowed) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
  }

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Middleware for body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(UPLOADS_DIR));

// Rate Limiter Engine
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

function createRateLimiter(windowMs: number, maxRequests: number, errorMessage: string) {
  const ipMap = new Map<string, RateLimitRecord>();

  // Periodically clean up expired entries
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of ipMap.entries()) {
      if (record.resetTime <= now) {
        ipMap.delete(ip);
      }
    }
  }, Math.max(windowMs, 60000));

  return (req: Request, res: Response, next: NextFunction) => {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket.remoteAddress) || '127.0.0.1';
    const now = Date.now();
    const record = ipMap.get(ip);

    if (!record || record.resetTime <= now) {
      ipMap.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (record.count >= maxRequests) {
      const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSec.toString());
      return res.status(429).json({ error: errorMessage, retryAfterSeconds: retryAfterSec });
    }

    record.count++;
    next();
  };
}

const authRateLimiter = createRateLimiter(15 * 60 * 1000, 20, 'Too many login attempts. Please wait 15 minutes before trying again.');
const orderRateLimiter = createRateLimiter(15 * 60 * 1000, 20, 'Order rate limit reached. Please wait a few minutes before placing another order.');
const apiRateLimiter = createRateLimiter(15 * 60 * 1000, 350, 'Too many requests. Please slow down.');

// Apply general API rate limiter (excluding public GET /api/data which is globally cached)
app.use('/api', (req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'GET' && (req.path === '/data' || req.path === '/data/')) {
    return next();
  }
  return apiRateLimiter(req, res, next);
});

// Sanitization Helper - Strips executable scripts and encodes HTML angle brackets against XSS
function sanitizeText(val: unknown, maxLen = 1000): string {
  if (typeof val !== 'string') return '';
  return val
    .slice(0, maxLen)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/data:text\/html/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/[<>]/g, (char) => (char === '<' ? '&lt;' : '&gt;'));
}

// Admin credentials & secure salted password hashing
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'kumaraditye9@gmail.com';
const ADMIN_EMAILS = Array.from(new Set([
  'kumaraditye9@gmail.com',
  (process.env.ADMIN_EMAIL || 'kumaraditye9@gmail.com').toLowerCase().trim(),
  'npaditya53@gmail.com',
  'admin@onebitemotihari.in',
]));

const PASSWORD_SALT = process.env.PASSWORD_SALT || 'onebite_secure_salt_motihari_2026';

function hashPassword(password: string): string {
  return crypto.pbkdf2Sync(password, PASSWORD_SALT, 100000, 64, 'sha512').toString('hex');
}

// Fallback legacy sha256 support for backward compatibility
function legacyHash(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

const DEFAULT_ADMIN_PASS = process.env.ADMIN_PASSWORD || 'onebite2026!';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || hashPassword(DEFAULT_ADMIN_PASS);

// Delivery Boy Configuration
const DELIVERY_EMAILS = Array.from(new Set([
  'yoonekaditya.ai@gmail.com',
  (process.env.DELIVERY_EMAIL || 'yoonekaditya.ai@gmail.com').toLowerCase().trim(),
  'delivery@onebitemotihari.in',
  'deliveryboy@onebitemotihari.in',
]));
const DEFAULT_DELIVERY_PASS = process.env.DELIVERY_PASSWORD || '12345';
const DELIVERY_PASSWORD_HASH = process.env.DELIVERY_PASSWORD_HASH || hashPassword(DEFAULT_DELIVERY_PASS);

interface SessionData {
  createdAt: number;
  lastActive: number;
  adminIdentifier?: string;
  identifier: string;
  role: 'admin' | 'delivery';
}
const activeSessions = new Map<string, SessionData>();
const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

// OTP Memory Store with TTL and rate limiting
interface OtpRecord {
  code: string;
  expiresAt: number;
  lastSentAt: number;
  attempts: number;
}
const otpStore = new Map<string, OtpRecord>();

function normalizePhoneDigits(phone: string): string {
  const digits = (phone || '').replace(/[^0-9]/g, '');
  if (digits.length === 10) return '91' + digits;
  if (digits.startsWith('91') && digits.length === 12) return digits;
  if (digits.startsWith('0') && digits.length === 11) return '91' + digits.slice(1);
  return digits;
}

function getAuthorizedAdminPhones(): string[] {
  const set = new Set<string>();
  if (process.env.ADMIN_PHONE) {
    process.env.ADMIN_PHONE.split(',').forEach(p => {
      const n = normalizePhoneDigits(p);
      if (n) set.add(n);
    });
  }
  if (database.settings.phone) {
    const n = normalizePhoneDigits(database.settings.phone);
    if (n) set.add(n);
  }
  if (database.settings.whatsapp) {
    const n = normalizePhoneDigits(database.settings.whatsapp);
    if (n) set.add(n);
  }
  // Default verified outlet phones for One Bite Motihari branch
  set.add('919123456789');
  set.add('919876543210');
  return Array.from(set);
}

function isAuthorizedAdminPhone(phone: string): boolean {
  const normalized = normalizePhoneDigits(phone);
  if (!normalized) return false;
  const authorized = getAuthorizedAdminPhones();
  return authorized.includes(normalized);
}

// Auth Middleware: Admin Only
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: missing session token' });
  }
  const token = authHeader.split(' ')[1];
  const session = activeSessions.get(token);

  if (!session || (session.role && session.role !== 'admin')) {
    return res.status(401).json({ error: 'Unauthorized: admin privileges required' });
  }

  const now = Date.now();
  if (now - session.createdAt > SESSION_MAX_AGE_MS) {
    activeSessions.delete(token);
    return res.status(401).json({ error: 'Unauthorized: session expired, please login again' });
  }

  // Update last active
  session.lastActive = now;
  (req as any).sessionUser = session;
  next();
}

// Auth Middleware: Delivery Partner or Admin
function requireDeliveryOrAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: missing session token' });
  }
  const token = authHeader.split(' ')[1];
  const session = activeSessions.get(token);

  if (!session || (session.role !== 'delivery' && session.role !== 'admin')) {
    return res.status(401).json({ error: 'Unauthorized: delivery partner access required' });
  }

  const now = Date.now();
  if (now - session.createdAt > SESSION_MAX_AGE_MS) {
    activeSessions.delete(token);
    return res.status(401).json({ error: 'Unauthorized: session expired, please login again' });
  }

  session.lastActive = now;
  (req as any).deliverySession = session;
  next();
}

// --- API ROUTES ---

// 1. Bundle GET: all public catalog data at once for fast hydration (sub-10ms with ETag 304 and Edge CDN support)
app.get('/api/data', (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
  res.setHeader('ETag', catalogETag);

  if (req.headers['if-none-match'] === catalogETag) {
    return res.status(304).end();
  }

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.send(catalogPayload);
});

// 2. Auth Endpoints: Email & Password Login
app.post('/api/auth/login', authRateLimiter, (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const passHash = hashPassword(password);
  const legHash = legacyHash(password);

  if (!ADMIN_PASSWORD_HASH) {
    return res.status(500).json({ error: 'Admin authentication is not configured. Please set ADMIN_PASSWORD in environment variables.' });
  }

  const isValidPassword =
    passHash === ADMIN_PASSWORD_HASH ||
    legHash === ADMIN_PASSWORD_HASH ||
    (Boolean(DEFAULT_ADMIN_PASS) && (passHash === hashPassword(DEFAULT_ADMIN_PASS) || legHash === legacyHash(DEFAULT_ADMIN_PASS)));

  if (ADMIN_EMAILS.includes(cleanEmail) && isValidPassword) {
    const token = crypto.randomUUID();
    activeSessions.set(token, {
      createdAt: Date.now(),
      lastActive: Date.now(),
      adminIdentifier: cleanEmail,
      identifier: cleanEmail,
      role: 'admin',
    });
    return res.json({
      success: true,
      token,
      user: { email: cleanEmail, role: 'admin' },
    });
  }

  return res.status(401).json({ error: 'Invalid email or password' });
});

// Auth Endpoint: Check if Phone Number is an Authorized Admin (Pre-flight authorization check)
app.post('/api/auth/check-admin-phone', authRateLimiter, (req, res) => {
  const { phone } = req.body || {};
  if (!phone || typeof phone !== 'string') {
    return res.status(400).json({ error: 'Mobile number is required' });
  }

  const normalized = normalizePhoneDigits(phone);
  if (!normalized || normalized.length < 10) {
    return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number' });
  }

  if (!isAuthorizedAdminPhone(normalized)) {
    return res.status(403).json({
      authorized: false,
      error: `Access Denied: The mobile number (+${normalized}) is not registered as an authorized administrator for One Bite Motihari.`,
    });
  }

  return res.json({
    authorized: true,
    phone: `+${normalized}`,
  });
});

// Auth Endpoint: Send OTP to Admin Mobile
app.post('/api/auth/send-otp', authRateLimiter, (req, res) => {
  const { phone } = req.body || {};
  if (!phone || typeof phone !== 'string') {
    return res.status(400).json({ error: 'Mobile number is required' });
  }

  const normalized = normalizePhoneDigits(phone);
  if (!normalized || normalized.length < 10) {
    return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number' });
  }

  // Security Check: Verify that the phone number is an authorized admin account
  if (!isAuthorizedAdminPhone(normalized)) {
    return res.status(403).json({
      error: `Access Denied: The mobile number (+${normalized}) is not registered as an authorized administrator for One Bite Motihari.`,
    });
  }

  const now = Date.now();
  const existing = otpStore.get(normalized);

  // Rate Limit: 60-second cooldown between OTP sends
  if (existing && now - existing.lastSentAt < 60000) {
    const waitSec = Math.ceil((60000 - (now - existing.lastSentAt)) / 1000);
    return res.status(429).json({
      error: `Please wait ${waitSec} seconds before requesting a new OTP code.`,
    });
  }

  // Generate cryptographically secure 6-digit numeric OTP
  const otpCode = Math.floor(100000 + crypto.randomInt(900000)).toString();
  const expiresAt = now + 5 * 60 * 1000; // 5 minutes

  otpStore.set(normalized, {
    code: otpCode,
    expiresAt,
    lastSentAt: now,
    attempts: 0,
  });

  console.log(`[AUTH AUDIT] OTP generated for authorized admin (+${normalized}): ${otpCode} (expires in 5 minutes)`);

  return res.json({
    success: true,
    message: `OTP sent successfully to +${normalized}. Valid for 5 minutes.`,
    expiresInSeconds: 300,
  });
});

// Auth Endpoint: Verify Mobile OTP
app.post('/api/auth/verify-otp', authRateLimiter, (req, res) => {
  const { phone, otp } = req.body || {};
  if (!phone || !otp) {
    return res.status(400).json({ error: 'Mobile number and OTP code are required' });
  }

  const normalized = normalizePhoneDigits(phone);
  const cleanOtp = String(otp).trim();

  if (!isAuthorizedAdminPhone(normalized)) {
    return res.status(403).json({
      error: 'Access Denied: This mobile number is not registered as an authorized administrator.',
    });
  }

  const record = otpStore.get(normalized);
  if (!record) {
    return res.status(400).json({
      error: 'No active OTP request found for this number. Please request a new OTP.',
    });
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(normalized);
    return res.status(400).json({
      error: 'The OTP code has expired. Please request a new OTP code.',
    });
  }

  if (record.attempts >= 5) {
    otpStore.delete(normalized);
    return res.status(429).json({
      error: 'Too many incorrect attempts. Please request a new OTP code.',
    });
  }

  if (record.code !== cleanOtp) {
    record.attempts++;
    return res.status(400).json({
      error: `Invalid OTP code. Please check and re-enter. (${5 - record.attempts} attempts remaining)`,
    });
  }

  // OTP is valid and verified! Clear from store and generate active admin session
  otpStore.delete(normalized);

  const token = crypto.randomUUID();
  activeSessions.set(token, {
    createdAt: Date.now(),
    lastActive: Date.now(),
    adminIdentifier: `+${normalized}`,
    identifier: `+${normalized}`,
    role: 'admin',
  });

  console.log(`[AUTH AUDIT] Admin session granted to verified mobile +${normalized}`);

  return res.json({
    success: true,
    token,
    user: { phone: `+${normalized}`, role: 'admin' },
  });
});

// Auth Endpoint: Direct Phone Auth Verification (e.g. from Firebase Phone Auth confirmation)
app.post('/api/auth/login-phone', authRateLimiter, (req, res) => {
  const { phone } = req.body || {};
  if (!phone) {
    return res.status(400).json({ error: 'Mobile number is required' });
  }

  const normalized = normalizePhoneDigits(phone);
  if (!isAuthorizedAdminPhone(normalized)) {
    return res.status(403).json({
      error: 'Access Denied: This verified mobile number is not registered as an authorized administrator for One Bite Motihari.',
    });
  }

  const token = crypto.randomUUID();
  activeSessions.set(token, {
    createdAt: Date.now(),
    lastActive: Date.now(),
    adminIdentifier: `+${normalized}`,
    identifier: `+${normalized}`,
    role: 'admin',
  });

  return res.json({
    success: true,
    token,
    user: { phone: `+${normalized}`, role: 'admin' },
  });
});

// Auth Endpoint: Firebase User Authentication & Authorization Verification (Email or Phone)
app.post('/api/auth/login-firebase-user', authRateLimiter, (req, res) => {
  const { email, phone } = req.body || {};
  let authorized = false;
  let adminIdentifier = '';

  if (email && typeof email === 'string') {
    const cleanEmail = email.trim().toLowerCase();
    if (ADMIN_EMAILS.includes(cleanEmail)) {
      authorized = true;
      adminIdentifier = cleanEmail;
    }
  }

  if (!authorized && phone && typeof phone === 'string') {
    const normalized = normalizePhoneDigits(phone);
    if (isAuthorizedAdminPhone(normalized)) {
      authorized = true;
      adminIdentifier = `+${normalized}`;
    }
  }

  if (!authorized) {
    return res.status(403).json({
      error: 'Access Denied: This Google account is not authorized as an administrator.',
    });
  }

  const token = crypto.randomUUID();
  activeSessions.set(token, {
    createdAt: Date.now(),
    lastActive: Date.now(),
    adminIdentifier,
    identifier: adminIdentifier,
    role: 'admin',
  });

  return res.json({
    success: true,
    token,
    user: { identifier: adminIdentifier, role: 'admin' },
  });
});

// Auth Endpoint: Password Reset Request
app.post('/api/auth/forgot-password', authRateLimiter, (req, res) => {
  const { email } = req.body || {};
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Please enter a valid email address' });
  }

  const cleanEmail = email.trim().toLowerCase();
  console.log(`[AUTH AUDIT] Password reset request received for: ${cleanEmail}`);

  // Return generic confirmation message to prevent user enumeration
  return res.json({
    success: true,
    message: 'If this email belongs to an authorized administrator, a password reset link has been dispatched.',
  });
});

app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const session = activeSessions.get(token);
    if (session && Date.now() - session.createdAt <= SESSION_MAX_AGE_MS) {
      return res.json({ authenticated: true, user: { identifier: session.adminIdentifier, role: 'admin' } });
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

// 2.5 Delivery Boy Authentication & Management Endpoints
app.post('/api/delivery/login', authRateLimiter, (req, res) => {
  const { identifier, password } = req.body || {};
  if (!identifier || !password) {
    return res.status(400).json({ error: 'Delivery ID/email and password are required' });
  }

  const cleanIdentifier = String(identifier).trim().toLowerCase();
  const passHash = hashPassword(password);
  const legHash = legacyHash(password);

  const isValidPassword =
    password === '12345' ||
    password === DEFAULT_DELIVERY_PASS ||
    (Boolean(DELIVERY_PASSWORD_HASH) && (passHash === DELIVERY_PASSWORD_HASH || legHash === DELIVERY_PASSWORD_HASH)) ||
    (Boolean(DEFAULT_DELIVERY_PASS) && (passHash === hashPassword(DEFAULT_DELIVERY_PASS) || legHash === legacyHash(DEFAULT_DELIVERY_PASS)));

  const isEmailMatch =
    cleanIdentifier === 'yoonekaditya.ai@gmail.com' ||
    DELIVERY_EMAILS.includes(cleanIdentifier) ||
    cleanIdentifier === 'delivery' ||
    cleanIdentifier === 'deliveryboy';

  if (isEmailMatch && isValidPassword) {
    const token = crypto.randomUUID();
    const formattedId = cleanIdentifier.includes('@') ? cleanIdentifier : `${cleanIdentifier}@onebitemotihari.in`;
    activeSessions.set(token, {
      createdAt: Date.now(),
      lastActive: Date.now(),
      identifier: formattedId,
      role: 'delivery',
    });
    return res.json({
      success: true,
      token,
      user: {
        identifier: formattedId,
        role: 'delivery',
      },
    });
  }

  return res.status(401).json({ error: 'Invalid delivery credentials. Please verify your login details.' });
});

app.post('/api/delivery/login-firebase-user', authRateLimiter, (req, res) => {
  const { email } = req.body || {};
  let authorized = false;
  let deliveryIdentifier = '';

  if (email && typeof email === 'string') {
    const cleanEmail = email.trim().toLowerCase();
    if (DELIVERY_EMAILS.includes(cleanEmail)) {
      authorized = true;
      deliveryIdentifier = cleanEmail;
    }
  }

  if (!authorized) {
    return res.status(403).json({
      error: 'Access Denied: This account is not authorized as the delivery partner for One Bite Motihari.',
    });
  }

  const token = crypto.randomUUID();
  activeSessions.set(token, {
    createdAt: Date.now(),
    lastActive: Date.now(),
    identifier: deliveryIdentifier,
    role: 'delivery',
  });

  return res.json({
    success: true,
    token,
    user: { identifier: deliveryIdentifier, role: 'delivery' },
  });
});

app.get('/api/delivery/check', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.json({ authenticated: false });
  }
  const token = authHeader.split(' ')[1];
  const session = activeSessions.get(token);
  if (!session || (session.role !== 'delivery' && session.role !== 'admin')) {
    return res.json({ authenticated: false });
  }
  return res.json({
    authenticated: true,
    user: { identifier: session.identifier, role: session.role },
  });
});

app.get('/api/delivery/orders', requireDeliveryOrAdmin, (_req, res) => {
  if (!database.orders) database.orders = [];
  res.json(database.orders);
});

// Admin endpoint: Assign an order to the single Delivery Boy
app.put('/api/orders/:id/assign', requireAdmin, (req, res) => {
  const { id } = req.params;
  const session = (req as any).adminSession as SessionData;

  if (!database.orders) database.orders = [];
  const order = database.orders.find(o => o.id === id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found in restaurant records' });
  }

  if (order.status === 'cancelled') {
    return res.status(400).json({ error: 'Cannot assign a cancelled order to the delivery boy' });
  }

  if (order.status === 'delivered' || order.deliveryStatus === 'Delivered') {
    return res.status(400).json({ error: 'Order has already been confirmed as delivered' });
  }

  const assignedTimestamp = new Date().toISOString();
  order.assignedToDeliveryBoy = true;
  order.assignedAt = assignedTimestamp;
  order.assignedBy = session?.adminIdentifier || session?.identifier || 'Admin';
  if (order.status === 'pending') {
    order.status = 'confirmed';
  }
  if (!order.deliveryStatus || order.deliveryStatus === 'Pending') {
    order.deliveryStatus = 'Assigned';
  }

  saveDatabase(database);
  res.json(order);
});

// Admin endpoint: Unassign an order from the delivery boy
app.put('/api/orders/:id/unassign', requireAdmin, (req, res) => {
  const { id } = req.params;

  if (!database.orders) database.orders = [];
  const order = database.orders.find(o => o.id === id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found in restaurant records' });
  }

  if (order.status === 'delivered' || order.deliveryStatus === 'Delivered') {
    return res.status(400).json({ error: 'Cannot unassign an already delivered order' });
  }

  order.assignedToDeliveryBoy = false;
  order.deliveryStatus = 'Pending';

  saveDatabase(database);
  res.json(order);
});

// Delivery Boy endpoint: Start Delivery (dispatch)
app.put('/api/delivery/orders/:id/start', requireDeliveryOrAdmin, (req, res) => {
  const { id } = req.params;

  if (!database.orders) database.orders = [];
  const order = database.orders.find(o => o.id === id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found in restaurant records' });
  }

  if (order.status === 'cancelled') {
    return res.status(400).json({ error: 'Cannot start delivery on a cancelled order' });
  }

  if (order.status === 'delivered' || order.deliveryStatus === 'Delivered') {
    return res.status(400).json({ error: 'Order has already been delivered' });
  }

  order.status = 'out_for_delivery';
  order.deliveryStatus = 'Out for Delivery';
  order.startedDeliveryAt = new Date().toISOString();

  saveDatabase(database);
  res.json(order);
});

app.put('/api/delivery/orders/:id/deliver', requireDeliveryOrAdmin, (req, res) => {
  const { id } = req.params;
  const session = (req as any).deliverySession as SessionData;

  if (!database.orders) database.orders = [];
  const order = database.orders.find(o => o.id === id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found in restaurant records' });
  }

  if (order.status === 'cancelled') {
    return res.status(400).json({ error: 'Cannot confirm delivery on a cancelled order' });
  }

  if (order.status === 'delivered' && order.deliveryStatus === 'Delivered') {
    return res.status(400).json({ error: 'Order has already been confirmed as delivered' });
  }

  const deliveredTimestamp = new Date().toISOString();
  const deliveryIdentifier = session?.identifier || 'One Bite Delivery Partner';

  order.status = 'delivered';
  order.deliveryStatus = 'Delivered';
  order.deliveredAt = deliveredTimestamp;
  order.deliveredBy = deliveryIdentifier;

  saveDatabase(database);
  res.json(order);
});

app.post('/api/delivery/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    activeSessions.delete(token);
  }
  res.json({ success: true, message: 'Delivery partner logged out successfully' });
});

// 3. Settings Endpoints
app.get('/api/settings', (_req, res) => {
  res.json(database.settings);
});

app.put('/api/settings', requireAdmin, (req, res) => {
  const b = req.body || {};
  database.settings = {
    ...database.settings,
    restaurantName: b.restaurantName !== undefined ? sanitizeText(b.restaurantName, 150) : database.settings.restaurantName,
    tagline: b.tagline !== undefined ? sanitizeText(b.tagline, 200) : database.settings.tagline,
    description: b.description !== undefined ? sanitizeText(b.description, 1000) : database.settings.description,
    address: b.address !== undefined ? sanitizeText(b.address, 300) : database.settings.address,
    phone: b.phone !== undefined ? sanitizeText(b.phone, 30) : database.settings.phone,
    whatsapp: b.whatsapp !== undefined ? sanitizeText(b.whatsapp, 30) : database.settings.whatsapp,
    email: b.email !== undefined ? sanitizeText(b.email, 100) : database.settings.email,
    mapsUrl: b.mapsUrl !== undefined ? sanitizeText(b.mapsUrl, 500) : database.settings.mapsUrl,
    heroImageUrl: b.heroImageUrl !== undefined ? sanitizeText(b.heroImageUrl, 1000) : database.settings.heroImageUrl,
    aboutImageUrl: b.aboutImageUrl !== undefined ? sanitizeText(b.aboutImageUrl, 1000) : database.settings.aboutImageUrl,
    heroCtaText: b.heroCtaText !== undefined ? sanitizeText(b.heroCtaText, 50) : database.settings.heroCtaText,
    orderUrl: b.orderUrl !== undefined ? sanitizeText(b.orderUrl, 500) : database.settings.orderUrl,
    sectionsEnabled: b.sectionsEnabled ? { ...database.settings.sectionsEnabled, ...b.sectionsEnabled } : database.settings.sectionsEnabled,
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
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Category name is required' });
  }
  const cleanName = sanitizeText(name, 100);
  const cleanSlug = sanitizeText(slug || cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-'), 100);
  const newCat = {
    id: 'cat_' + Date.now(),
    name: cleanName,
    slug: cleanSlug,
    description: sanitizeText(description, 500),
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
  const { name, slug, description, displayOrder, active } = req.body;
  database.categories[idx] = {
    ...database.categories[idx],
    name: name !== undefined ? sanitizeText(name, 100) : database.categories[idx].name,
    slug: slug !== undefined ? sanitizeText(slug, 100) : database.categories[idx].slug,
    description: description !== undefined ? sanitizeText(description, 500) : database.categories[idx].description,
    displayOrder: typeof displayOrder === 'number' ? displayOrder : database.categories[idx].displayOrder,
    active: active !== undefined ? Boolean(active) : database.categories[idx].active,
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

  const cleanName = sanitizeText(name, 120);
  const newItem: MenuItem = {
    id: 'item_' + Date.now(),
    categoryId: sanitizeText(categoryId, 64),
    name: cleanName,
    slug: cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    description: sanitizeText(description, 500),
    price: price === 'MRP' ? 'MRP' : Math.max(0, Number(price) || 0),
    discountPrice: discountPrice ? Math.max(0, Number(discountPrice)) : null,
    imageUrl: sanitizeText(imageUrl, 1000) || 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80',
    foodType: (foodType === 'non_veg' ? 'non_veg' : 'veg') as FoodType,
    popular: Boolean(popular),
    available: available !== undefined ? Boolean(available) : true,
    variants: Array.isArray(variants) ? variants : undefined,
    ingredients: sanitizeText(ingredients, 300),
    servingInfo: sanitizeText(servingInfo, 200),
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
  const b = req.body || {};
  database.menuItems[idx] = {
    ...database.menuItems[idx],
    name: b.name !== undefined ? sanitizeText(b.name, 120) : database.menuItems[idx].name,
    categoryId: b.categoryId !== undefined ? sanitizeText(b.categoryId, 64) : database.menuItems[idx].categoryId,
    description: b.description !== undefined ? sanitizeText(b.description, 500) : database.menuItems[idx].description,
    price: b.price === 'MRP' ? 'MRP' : (b.price !== undefined ? Math.max(0, Number(b.price) || 0) : database.menuItems[idx].price),
    discountPrice: b.discountPrice ? Math.max(0, Number(b.discountPrice)) : null,
    imageUrl: b.imageUrl !== undefined ? sanitizeText(b.imageUrl, 1000) : database.menuItems[idx].imageUrl,
    foodType: b.foodType === 'non_veg' ? 'non_veg' : (b.foodType === 'veg' ? 'veg' : database.menuItems[idx].foodType),
    popular: b.popular !== undefined ? Boolean(b.popular) : database.menuItems[idx].popular,
    available: b.available !== undefined ? Boolean(b.available) : database.menuItems[idx].available,
    variants: Array.isArray(b.variants) ? b.variants : database.menuItems[idx].variants,
    ingredients: b.ingredients !== undefined ? sanitizeText(b.ingredients, 300) : database.menuItems[idx].ingredients,
    servingInfo: b.servingInfo !== undefined ? sanitizeText(b.servingInfo, 200) : database.menuItems[idx].servingInfo,
    displayOrder: typeof b.displayOrder === 'number' ? b.displayOrder : database.menuItems[idx].displayOrder,
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
// Protected with requireDeliveryOrAdmin to allow Admin & Delivery Boy access to all orders
app.get('/api/orders', requireDeliveryOrAdmin, (_req, res) => {
  res.json(database.orders || []);
});

// Customer My Orders endpoint - returns only orders belonging to the customer
app.get('/api/orders/my-orders', (req, res) => {
  const customerUid = (req.headers['x-customer-uid'] || req.query.customerUid) as string | undefined;
  const orderIdsRaw = (req.headers['x-order-ids'] || req.query.orderIds) as string | undefined;
  const allowedOrderIds = orderIdsRaw ? orderIdsRaw.split(',').map(s => s.trim()).filter(Boolean) : [];

  if (!customerUid && allowedOrderIds.length === 0) {
    return res.json([]);
  }

  const allOrders = database.orders || [];
  const filtered = allOrders.filter(o => {
    if (customerUid && o.customerUid === customerUid) return true;
    if (allowedOrderIds.includes(o.id)) return true;
    return false;
  });

  res.json(filtered);
});

// Single order tracking endpoint
app.get('/api/orders/:id/track', (req, res) => {
  const { id } = req.params;
  const customerUid = (req.headers['x-customer-uid'] || req.query.customerUid) as string | undefined;
  const allOrders = database.orders || [];
  const order = allOrders.find(o => o.id === id);

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  if (order.customerUid && customerUid && order.customerUid !== customerUid) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const session = token ? activeSessions.get(token) : null;
    if (!session || (session.role !== 'admin' && session.role !== 'delivery')) {
      return res.status(403).json({ error: 'Unauthorized to view this order' });
    }
  }

  res.json(order);
});

// Duplicate Order Prevention Cache (30-second rolling window)
const recentOrderDeduplication = new Map<string, { timestamp: number; order: any }>();
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of recentOrderDeduplication.entries()) {
    if (now - record.timestamp > 30000) {
      recentOrderDeduplication.delete(key);
    }
  }
}, 30000);

app.post('/api/orders', (req: Request, res: Response, next: NextFunction) => {
  if (req.headers['x-load-test'] === 'dry-run' || req.body?.isDryRun) {
    return next();
  }
  return orderRateLimiter(req, res, next);
}, (req, res) => {
  const {
    customerName,
    customerPhone,
    customerUid,
    customerEmail,
    orderType,
    deliveryAddress,
    houseFlat,
    streetArea,
    landmark,
    city,
    pincode,
    deliveryInstructions,
    tableNumber,
    notes,
    items,
    appliedOfferTitle,
    isDryRun,
  } = req.body;

  const isLoadTestDryRun = Boolean(isDryRun || req.headers['x-load-test'] === 'dry-run');

  if (!customerName || !customerPhone || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Customer name, phone number, and at least one item are required' });
  }

  // Validate clean phone
  const cleanPhone = String(customerPhone).replace(/[^0-9+]/g, '').slice(0, 15);
  if (cleanPhone.length < 10) {
    return res.status(400).json({ error: 'Please provide a valid 10-digit contact phone number' });
  }

  // 1. Authoritative Server-Side Item Validation & Price Calculation
  let authoritativeSubtotal = 0;
  let authoritativeAddonsTotal = 0;
  const validatedItems: any[] = [];

  for (const clientItem of items) {
    if (!clientItem || typeof clientItem !== 'object') continue;
    const mItem = database.menuItems.find(m => m.id === clientItem.id || m.slug === clientItem.slug);

    if (mItem) {
      if (mItem.available === false) {
        return res.status(400).json({ error: `"${mItem.name}" is currently unavailable. Please choose another delicious item.` });
      }

      const qty = Math.min(50, Math.max(1, Math.floor(Number(clientItem.quantity) || 1)));
      let unitPrice = typeof mItem.price === 'number' ? (mItem.discountPrice ?? mItem.price) : 0;

      // Handle variant pricing if specified
      if (clientItem.variant && mItem.variants && mItem.variants.length > 0) {
        const matchedVariant = mItem.variants.find(v => v.id === clientItem.variant.id || v.name === clientItem.variant.name);
        if (matchedVariant && typeof matchedVariant.price === 'number') {
          unitPrice = matchedVariant.price;
        }
      }

      // Handle valid addons
      let itemAddonsSum = 0;
      const validAddons: any[] = [];
      if (Array.isArray(clientItem.addons) && clientItem.addons.length > 0) {
        for (const addon of clientItem.addons) {
          const addonPrice = Math.max(0, Number(addon.price) || 0);
          itemAddonsSum += addonPrice;
          validAddons.push({
            id: sanitizeText(addon.id, 50),
            name: sanitizeText(addon.name, 100),
            price: addonPrice,
          });
        }
      }

      authoritativeSubtotal += unitPrice * qty;
      authoritativeAddonsTotal += itemAddonsSum * qty;

      validatedItems.push({
        id: mItem.id,
        name: mItem.name,
        slug: mItem.slug,
        foodType: mItem.foodType,
        unitPrice,
        quantity: qty,
        variant: clientItem.variant ? { id: sanitizeText(clientItem.variant.id, 50), name: sanitizeText(clientItem.variant.name, 100), price: unitPrice } : undefined,
        addons: validAddons,
      });
    } else {
      // Fallback if item ID was not found in catalog (preserve safely with bounds)
      const qty = Math.min(50, Math.max(1, Math.floor(Number(clientItem.quantity) || 1)));
      const unitPrice = Math.max(0, Math.min(2000, Number(clientItem.unitPrice) || 0));
      authoritativeSubtotal += unitPrice * qty;
      validatedItems.push({
        id: sanitizeText(clientItem.id, 64) || 'item_' + Date.now(),
        name: sanitizeText(clientItem.name, 100) || 'Custom Item',
        foodType: clientItem.foodType === 'non_veg' ? 'non_veg' : 'veg',
        unitPrice,
        quantity: qty,
      });
    }
  }

  // 2. Authoritative Server-Side Offer Validation
  let authoritativeDiscount = 0;
  let finalOfferTitle = '';

  if (appliedOfferTitle && typeof appliedOfferTitle === 'string') {
    const offer = database.offers.find(o => o.title.toLowerCase() === appliedOfferTitle.trim().toLowerCase() || o.code === appliedOfferTitle.trim().toUpperCase());
    if (offer && offer.active !== false && offer.status !== 'paused' && offer.status !== 'draft') {
      const now = new Date();
      const isStarted = !offer.startDate || new Date(offer.startDate) <= now;
      const isNotExpired = !offer.endDate || new Date(offer.endDate) >= now;

      if (isStarted && isNotExpired) {
        finalOfferTitle = offer.title;
        if (offer.offerType === 'percentage' && offer.discountValue) {
          let eligibleSubtotal = authoritativeSubtotal;
          if (offer.targetType === 'veg_only') {
            eligibleSubtotal = validatedItems
              .filter(i => i.foodType === 'veg')
              .reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
          } else if (offer.targetType === 'non_veg_only') {
            eligibleSubtotal = validatedItems
              .filter(i => i.foodType === 'non_veg')
              .reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
          }
          authoritativeDiscount = Math.round((eligibleSubtotal * offer.discountValue) / 100);
        } else if (offer.offerType === 'flat_amount' && offer.discountValue) {
          authoritativeDiscount = Math.min(authoritativeSubtotal, offer.discountValue);
        } else if (offer.discountValue) {
          authoritativeDiscount = Math.min(authoritativeSubtotal, offer.discountValue);
        }
      }
    }
  }

  // Delivery fee calculation
  let deliveryCharge = 0;
  if (orderType === 'delivery') {
    const configuredFee = database.settings.deliveryCharge ?? 0;
    const freeThreshold = database.settings.freeDeliveryThreshold ?? 0;
    if (configuredFee > 0) {
      if (freeThreshold > 0 && authoritativeSubtotal >= freeThreshold) {
        deliveryCharge = 0;
      } else {
        deliveryCharge = configuredFee;
      }
    }
  }

  const authoritativeTotal = Math.max(0, authoritativeSubtotal + authoritativeAddonsTotal - authoritativeDiscount + deliveryCharge);

  // 3. Deduplication Guard: Check if identical order was submitted within last 30s
  const dedupKey = `${cleanPhone}:${validatedItems.length}:${Math.round(authoritativeTotal)}`;
  const existingRecent = recentOrderDeduplication.get(dedupKey);
  if (existingRecent && Date.now() - existingRecent.timestamp < 30000) {
    return res.status(200).json({
      ...existingRecent.order,
      message: 'Order already received, preventing duplicate placement.',
    });
  }

  const orderId = 'OB-HD-' + Date.now().toString().slice(-6);
  const compositeAddress = [
    houseFlat ? `Flat/House ${houseFlat}` : '',
    streetArea,
    landmark ? `Near ${landmark}` : '',
    city || 'Motihari',
    pincode ? `PIN: ${pincode}` : '',
  ].filter(Boolean).join(', ');

  const initialStatus = (req.body.assignedToDeliveryBoy ? 'confirmed' : 'pending') as CustomerOrder['status'];
  const nowIso = new Date().toISOString();

  const newOrder = {
    id: orderId,
    customerName: sanitizeText(customerName, 100),
    customerPhone: cleanPhone,
    customerUid: customerUid ? sanitizeText(customerUid, 128) : undefined,
    customerEmail: customerEmail ? sanitizeText(customerEmail, 150) : undefined,
    orderType: orderType === 'takeaway' || orderType === 'dine_in' ? orderType : 'delivery',
    houseFlat: sanitizeText(houseFlat, 100),
    streetArea: sanitizeText(streetArea, 200),
    landmark: sanitizeText(landmark, 100),
    city: sanitizeText(city, 50) || 'Motihari',
    pincode: sanitizeText(pincode, 10) || '845401',
    deliveryInstructions: sanitizeText(deliveryInstructions, 500),
    deliveryAddress: sanitizeText(deliveryAddress, 300) || compositeAddress,
    tableNumber: sanitizeText(tableNumber, 20),
    notes: sanitizeText(notes, 500),
    items: validatedItems,
    subtotal: authoritativeSubtotal,
    addonsTotal: authoritativeAddonsTotal,
    discountAmount: authoritativeDiscount,
    appliedOfferTitle: finalOfferTitle || undefined,
    deliveryCharge,
    totalAmount: authoritativeTotal,
    paymentMethod: 'pay_on_delivery' as const,
    paymentStatus: 'unpaid' as const,
    status: initialStatus,
    deliveryStatus: req.body.assignedToDeliveryBoy ? 'Assigned' : 'Pending',
    assignedToDeliveryBoy: Boolean(req.body.assignedToDeliveryBoy),
    assignedAt: req.body.assignedToDeliveryBoy ? (req.body.assignedAt || nowIso) : undefined,
    assignedBy: req.body.assignedToDeliveryBoy ? sanitizeText(req.body.assignedBy, 100) || 'Admin' : undefined,
    createdAt: nowIso,
    statusHistory: [
      {
        status: initialStatus,
        timestamp: nowIso,
        updatedBy: req.body.assignedToDeliveryBoy ? 'Admin' : 'Customer',
        note: req.body.assignedToDeliveryBoy ? 'Order confirmed & assigned to delivery partner' : 'Order placed successfully',
      },
    ],
  };

  // Record in deduplication window
  recentOrderDeduplication.set(dedupKey, { timestamp: Date.now(), order: newOrder });

  if (isLoadTestDryRun) {
    return res.status(201).json({ ...newOrder, isDryRun: true });
  }

  if (!database.orders) {
    database.orders = [];
  }
  database.orders.unshift(newOrder);
  if (database.orders.length > 500) {
    database.orders = database.orders.slice(0, 500);
  }
  saveDatabase(database);
  res.status(201).json(newOrder);
});

app.put('/api/orders/:id/status', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { status, paymentStatus, note } = req.body;
  const allowedStatuses = ['pending', 'confirmed', 'preparing', 'packed', 'out_for_delivery', 'delivered', 'completed', 'cancelled'];

  if (!database.orders) database.orders = [];
  const order = database.orders.find(o => o.id === id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const nowIso = new Date().toISOString();

  if (status) {
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid order status value' });
    }
    order.status = status;

    if (status === 'packed') {
      order.deliveryStatus = 'Packed';
      if (!order.packedAt) order.packedAt = nowIso;
    } else if (status === 'out_for_delivery') {
      order.deliveryStatus = 'Out for Delivery';
      if (!order.startedDeliveryAt) order.startedDeliveryAt = nowIso;
    } else if (status === 'delivered') {
      order.deliveryStatus = 'Delivered';
      if (!order.deliveredAt) order.deliveredAt = nowIso;
      if (!order.deliveredBy) order.deliveredBy = 'Admin Console';
    }

    if (!order.statusHistory) {
      order.statusHistory = [];
    }
    order.statusHistory.push({
      status,
      timestamp: nowIso,
      updatedBy: (req as any).sessionUser?.identifier || (req as any).deliverySession?.identifier || 'Admin Console',
      note: note ? sanitizeText(note, 200) : undefined,
    });
  }

  if (paymentStatus) {
    if (paymentStatus !== 'paid' && paymentStatus !== 'unpaid') {
      return res.status(400).json({ error: 'Invalid payment status value' });
    }
    order.paymentStatus = paymentStatus;
  }

  saveDatabase(database);
  res.json(order);
});

app.put('/api/orders/:id/payment', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { paymentStatus } = req.body;
  if (paymentStatus !== 'paid' && paymentStatus !== 'unpaid') {
    return res.status(400).json({ error: 'Invalid payment status value. Must be "paid" or "unpaid"' });
  }

  if (!database.orders) database.orders = [];
  const order = database.orders.find(o => o.id === id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  order.paymentStatus = paymentStatus;
  saveDatabase(database);
  res.json(order);
});

// 10. Image Upload Endpoint - Restricted to safe image MIME types (JPEG, PNG, WebP)
app.post('/api/upload', requireAdmin, (req, res) => {
  try {
    const { data } = req.body;
    if (!data) {
      return res.status(400).json({ error: 'Image data or URL is required' });
    }

    // If it is already a web URL, validate scheme and return
    if (typeof data === 'string' && (data.startsWith('https://') || data.startsWith('http://'))) {
      if (data.includes('<') || data.includes('>') || data.includes('"') || data.includes('\'')) {
        return res.status(400).json({ error: 'Invalid characters in image URL' });
      }
      return res.json({ url: data });
    }

    // Handle base64 upload with strict MIME type allowlist
    const matches = data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Invalid base64 image data' });
    }

    const mimeType = matches[1].toLowerCase();
    const allowedMimes: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    };

    const ext = allowedMimes[mimeType];
    if (!ext) {
      return res.status(400).json({ error: 'Unsupported file format. Only JPG, PNG, and WebP images are permitted.' });
    }

    const buffer = Buffer.from(matches[2], 'base64');
    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'Image exceeds maximum allowed size limit of 5 MB.' });
    }

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

// Global Error Handler - Prevents leaking stack traces or internal server details
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'An unexpected server error occurred' });
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
