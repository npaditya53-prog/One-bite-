import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  ActionCodeSettings,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  User
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  updateDoc,
  runTransaction
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { isRestaurantOpen } from '../utils/operatingHours.ts';
import { OrderStatus, StatusHistoryItem } from '../types/index.ts';

// Initialize Firebase safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: Must use firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
try {
  auth.useDeviceLanguage();
} catch {}

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection on boot
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase Firestore connection verified successfully.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    } else {
      console.warn('Firebase test connection response:', error);
    }
    return false;
  }
}

// Trigger initial connection verification
testConnection();

// Auth Helpers
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signInWithEmail(email: string, pass: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email, pass);
  return result.user;
}

export async function resetPasswordEmail(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

let globalRecaptchaVerifier: RecaptchaVerifier | null = null;
let globalRecaptchaWidgetId: number | null = null;

export function clearRecaptchaVerifier(): void {
  if (globalRecaptchaVerifier) {
    try {
      globalRecaptchaVerifier.clear();
    } catch (e) {
      console.warn('Error clearing RecaptchaVerifier:', e);
    }
    globalRecaptchaVerifier = null;
    globalRecaptchaWidgetId = null;
  }
  if (typeof document !== 'undefined') {
    const el = document.getElementById('recaptcha-container');
    if (el) {
      el.innerHTML = '';
    }
  }
}

export async function getOrCreateRecaptchaVerifier(
  containerId: string = 'recaptcha-container',
  onExpired?: () => void
): Promise<RecaptchaVerifier> {
  if (typeof document === 'undefined') {
    throw new Error('reCAPTCHA can only be initialized in browser environment.');
  }

  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error(`reCAPTCHA container #${containerId} not found in DOM.`);
  }

  // Clear previous instance and any stale DOM contents to prevent "already rendered" errors
  clearRecaptchaVerifier();
  container.innerHTML = '';

  const verifier = new RecaptchaVerifier(auth, container, {
    size: 'invisible',
    callback: () => {
      console.log('[AUTH] Invisible reCAPTCHA verification passed');
    },
    'expired-callback': () => {
      console.warn('[AUTH] reCAPTCHA token expired');
      if (onExpired) onExpired();
    },
  });

  globalRecaptchaVerifier = verifier;
  try {
    globalRecaptchaWidgetId = await verifier.render();
  } catch (renderErr) {
    console.warn('[AUTH] reCAPTCHA render note:', renderErr);
  }

  return verifier;
}

// Backward-compatible alias
export function createRecaptchaVerifier(containerId: string): RecaptchaVerifier {
  clearRecaptchaVerifier();
  const container = document.getElementById(containerId);
  if (container) container.innerHTML = '';
  const verifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
  });
  globalRecaptchaVerifier = verifier;
  return verifier;
}

export async function sendFirebasePhoneOtp(
  phoneNumber: string,
  appVerifier: RecaptchaVerifier
): Promise<ConfirmationResult> {
  return await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
}

export interface FirebasePhoneAuthErrorInfo {
  message: string;
  code: string;
  isConfigIssue: boolean;
}

export function getFirebasePhoneAuthErrorMessage(err: any): FirebasePhoneAuthErrorInfo {
  const code = err?.code || '';
  const rawMsg = err?.message || String(err || '');
  let message = 'Unable to send OTP via SMS. Please check your mobile number and try again.';
  let isConfigIssue = false;

  switch (code) {
    case 'auth/operation-not-allowed':
      message = 'Firebase Phone Authentication is disabled for this project. Please enable the "Phone" sign-in provider in your Firebase Console under Build > Authentication > Sign-in method.';
      isConfigIssue = true;
      break;

    case 'auth/unauthorized-domain': {
      const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'this domain';
      message = `This domain (${currentHost}) is not authorized for Firebase Authentication. Please add "${currentHost}" under Firebase Console > Authentication > Settings > Authorized domains.`;
      isConfigIssue = true;
      break;
    }

    case 'auth/invalid-phone-number':
      message = 'The mobile number format is invalid. Please enter a valid 10-digit Indian mobile number (+91XXXXXXXXXX).';
      break;

    case 'auth/missing-phone-number':
      message = 'Mobile number is missing. Please enter your 10-digit registered mobile number.';
      break;

    case 'auth/quota-exceeded':
      message = 'Firebase SMS quota exceeded. The daily SMS limit has been reached or billing needs to be configured in Firebase / Google Cloud Console.';
      isConfigIssue = true;
      break;

    case 'auth/too-many-requests':
      message = 'Too many requests have been made to this phone number. Firebase has temporarily blocked requests. Please wait a few minutes before trying again.';
      break;

    case 'auth/invalid-app-credential':
      message = 'Firebase phone verification failed (invalid app credential or reCAPTCHA token). Please ensure Phone Auth is enabled and authorized domains are configured in your Firebase Console.';
      isConfigIssue = true;
      break;

    case 'auth/captcha-check-failed':
      message = 'reCAPTCHA verification failed or timed out. Please refresh and try sending OTP again.';
      break;

    case 'auth/network-request-failed':
      message = 'Network error: unable to communicate with Firebase Authentication servers. Please check your internet connection.';
      break;

    case 'auth/code-expired':
      message = 'The OTP code has expired. Please request a new OTP code.';
      break;

    case 'auth/invalid-verification-code':
      message = 'Invalid OTP code. Please check the 6-digit code received on your phone and re-enter.';
      break;

    case 'auth/session-expired':
      message = 'The SMS verification session has expired. Please request a new OTP code.';
      break;

    case 'auth/user-disabled':
      message = 'This administrator account has been disabled in Firebase Authentication.';
      break;

    default:
      if (rawMsg.includes('reCAPTCHA') || rawMsg.includes('grecaptcha')) {
        message = 'reCAPTCHA initialization failed. Please ensure third-party scripts are allowed in your browser.';
      } else if (rawMsg) {
        message = rawMsg.replace(/^Firebase:\s*/i, '');
      }
      break;
  }

  return { message, code, isConfigIssue };
}

/**
 * Clean and sanitize order data for Firebase Firestore (strips undefined fields)
 */
export function sanitizeOrderForFirestore(order: Record<string, any>): Record<string, any> {
  const clean: Record<string, any> = {};
  for (const [key, val] of Object.entries(order)) {
    if (val !== undefined && val !== null) {
      if (Array.isArray(val)) {
        clean[key] = val.map(item =>
          item && typeof item === 'object' ? sanitizeOrderForFirestore(item) : item
        );
      } else if (typeof val === 'object' && !(val instanceof Date)) {
        clean[key] = sanitizeOrderForFirestore(val);
      } else {
        clean[key] = val;
      }
    }
  }
  return clean;
}

/**
 * Persist an order to Firebase Firestore (operating hours strictly validated)
 */
export async function saveOrderToFirestore(order: any, bypassHoursCheck = false): Promise<void> {
  if (!bypassHoursCheck && !isRestaurantOpen()) {
    throw new Error(
      'Restaurant Currently Closed: One Bite accepts orders only during operating hours (11:00 AM to 8:45 PM IST).'
    );
  }
  const cleanOrder = sanitizeOrderForFirestore(order);
  const orderRef = doc(db, 'orders', String(order.id));
  await setDoc(orderRef, cleanOrder);
}

/**
 * Assign an order to delivery boy in Firebase Firestore
 */
export async function assignOrderInFirestore(
  orderId: string,
  assignedData: { assignedAt?: string; assignedBy?: string } = {}
): Promise<void> {
  const orderRef = doc(db, 'orders', String(orderId));
  const updateData: Record<string, any> = {
    assignedToDeliveryBoy: true,
    assignedAt: assignedData.assignedAt || new Date().toISOString(),
    assignedBy: assignedData.assignedBy || 'Admin',
    deliveryStatus: 'Assigned',
  };
  await updateDoc(orderRef, updateData);
}

/**
 * Unassign an order in Firebase Firestore
 */
export async function unassignOrderInFirestore(orderId: string): Promise<void> {
  const orderRef = doc(db, 'orders', String(orderId));
  await updateDoc(orderRef, {
    assignedToDeliveryBoy: false,
    deliveryStatus: 'Pending',
  });
}

/**
 * Mark order out for delivery in Firebase Firestore
 */
export async function markOrderOutForDeliveryInFirestore(
  orderId: string,
  startedAt?: string,
  options: { updatedBy?: string; updaterId?: string } = {}
): Promise<void> {
  await updateOrderStatusInFirestore(orderId, 'out_for_delivery', {
    updatedBy: options.updatedBy || 'Delivery Boy',
    updaterId: options.updaterId || auth.currentUser?.email || 'delivery',
    customTimestamp: startedAt,
    note: 'Order dispatched for delivery',
  });
}

/**
 * Confirm order delivered in Firebase Firestore
 */
export async function markOrderDeliveredInFirestore(
  orderId: string,
  deliveryData: { deliveredBy?: string; deliveredAt?: string; updaterId?: string }
): Promise<void> {
  await updateOrderStatusInFirestore(orderId, 'delivered', {
    updatedBy: deliveryData.deliveredBy || 'Delivery Boy',
    updaterId: deliveryData.updaterId || auth.currentUser?.email || 'delivery',
    customTimestamp: deliveryData.deliveredAt,
    paymentStatus: 'paid',
    note: 'Order delivered successfully to customer',
  });
}

/**
 * Query orders belonging to a specific customer UID from Firebase Firestore
 */
export async function fetchCustomerOrdersFromFirestore(customerUid: string): Promise<any[]> {
  if (!customerUid) return [];
  try {
    const ordersCol = collection(db, 'orders');
    const q = query(ordersCol, where('customerUid', '==', customerUid));
    const snap = await getDocs(q);
    const results: any[] = [];
    snap.forEach((d) => {
      results.push({ ...d.data(), id: d.id });
    });
    // Sort descending by createdAt
    results.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    return results;
  } catch (err) {
    console.warn('Firestore fetchCustomerOrders error:', err);
    return [];
  }
}

/**
 * Recursively find any fields with 'undefined' value in an object or array for diagnostic reporting.
 */
export function findUndefinedFields(obj: any, path: string = ''): string[] {
  const undefinedPaths: string[] = [];
  if (obj === undefined) {
    undefinedPaths.push(path || 'root');
    return undefinedPaths;
  }
  if (obj === null || typeof obj !== 'object') {
    return undefinedPaths;
  }
  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      undefinedPaths.push(...findUndefinedFields(item, `${path}[${index}]`));
    });
  } else {
    for (const key of Object.keys(obj)) {
      const currentPath = path ? `${path}.${key}` : key;
      if (obj[key] === undefined) {
        undefinedPaths.push(currentPath);
      } else {
        undefinedPaths.push(...findUndefinedFields(obj[key], currentPath));
      }
    }
  }
  return undefinedPaths;
}

/**
 * Update order status and statusHistory atomically in Firebase Firestore using a transaction
 */
export async function updateOrderStatusInFirestore(
  orderId: string,
  newStatus: OrderStatus,
  options: {
    note?: string;
    updatedBy?: string;
    updaterId?: string;
    paymentStatus?: 'unpaid' | 'paid';
    customTimestamp?: string;
    bypassTransitionCheck?: boolean;
  } = {}
): Promise<void> {
  const orderRef = doc(db, 'orders', String(orderId));
  const nowIso = options.customTimestamp || new Date().toISOString();

  const statusNameMap: Record<string, string> = {
    pending: 'Order Placed',
    confirmed: 'Order Placed',
    preparing: 'Order Placed',
    packed: 'Order Packed',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    completed: 'Delivered',
    cancelled: 'Order Cancelled',
  };

  const statusName = statusNameMap[newStatus] || newStatus;

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(orderRef);
    if (!snap.exists()) {
      throw new Error(`Order #${orderId} does not exist in Firebase Firestore.`);
    }

    const current = snap.data() as any;
    const currentStatus = current.status;

    // Concurrency / Idempotency check: if status is already the same, do not duplicate
    if (currentStatus === newStatus) {
      return;
    }

    // Validate forward transitions unless bypass flag is specified
    if (!options.bypassTransitionCheck) {
      if (newStatus === 'delivered' && currentStatus !== 'out_for_delivery' && currentStatus !== 'delivered') {
        throw new Error('Invalid transition: Order must be marked "Out for Delivery" before it can be marked "Delivered".');
      }
      if (newStatus === 'out_for_delivery' && currentStatus !== 'packed' && currentStatus !== 'out_for_delivery') {
        if (currentStatus === 'pending' || currentStatus === 'confirmed') {
          throw new Error('Invalid transition: Order must be marked "Order Packed" before being dispatched Out for Delivery.');
        }
      }
      if (currentStatus === 'delivered' || currentStatus === 'completed') {
        throw new Error('This order has already been Delivered. Status cannot be modified.');
      }
      if (currentStatus === 'cancelled') {
        throw new Error('This order is cancelled and cannot be updated.');
      }
    }

    // Preserve existing status history and append new entry
    const rawExistingHistory = Array.isArray(current.statusHistory)
      ? current.statusHistory
      : [];
    const existingHistory: StatusHistoryItem[] = rawExistingHistory.map((item: any) =>
      sanitizeOrderForFirestore(item) as StatusHistoryItem
    );

    // If existing legacy order had no status history, seed initial placed entry if available
    if (existingHistory.length === 0 && current.createdAt) {
      existingHistory.push({
        status: (currentStatus === 'pending' || currentStatus === 'confirmed' ? currentStatus : 'pending') as OrderStatus,
        statusName: 'Order Placed',
        timestamp: current.placedAt || current.createdAt,
        updatedBy: 'Customer',
        updaterId: current.customerUid || 'customer',
        note: 'Order placed by customer',
      });
    }

    const newHistoryEntry: Record<string, any> = {
      status: newStatus,
      statusName,
      timestamp: nowIso,
      updatedBy: options.updatedBy || 'Admin',
      updaterId: options.updaterId || auth.currentUser?.email || auth.currentUser?.uid || 'admin',
    };

    if (options.note && options.note.trim()) {
      newHistoryEntry.note = options.note.trim();
    }

    const rawUpdatePayload: Record<string, any> = {
      status: newStatus,
      updatedAt: nowIso,
      statusHistory: [...existingHistory, newHistoryEntry],
    };

    if (options.paymentStatus) {
      rawUpdatePayload.paymentStatus = options.paymentStatus;
    }

    if (newStatus === 'packed') {
      rawUpdatePayload.deliveryStatus = 'Packed';
      if (!current.packedAt) rawUpdatePayload.packedAt = nowIso;
    } else if (newStatus === 'out_for_delivery') {
      rawUpdatePayload.deliveryStatus = 'Out for Delivery';
      if (!current.outForDeliveryAt) rawUpdatePayload.outForDeliveryAt = nowIso;
      if (!current.startedDeliveryAt) rawUpdatePayload.startedDeliveryAt = nowIso;
    } else if (newStatus === 'delivered') {
      rawUpdatePayload.deliveryStatus = 'Delivered';
      if (!current.deliveredAt) rawUpdatePayload.deliveredAt = nowIso;
      rawUpdatePayload.deliveredBy = options.updatedBy || 'One Bite Delivery';
      if (!current.paymentStatus || current.paymentStatus === 'unpaid') {
        rawUpdatePayload.paymentStatus = 'paid';
      }
    }

    // Strictly sanitize update payload to guarantee zero undefined fields
    const cleanUpdatePayload = sanitizeOrderForFirestore(rawUpdatePayload);

    // Diagnostic assertion: check for any remaining undefined fields
    const undefinedFields = findUndefinedFields(cleanUpdatePayload);
    if (undefinedFields.length > 0) {
      console.error('[Firestore Transaction Error] Payload contains undefined fields:', undefinedFields);
      throw new Error(
        `Transaction.update() payload contains unsupported undefined field(s): ${undefinedFields.join(', ')}`
      );
    }

    transaction.update(orderRef, cleanUpdatePayload);
  });
}

export async function signOutUser(): Promise<void> {
  await firebaseSignOut(auth);
}

/**
 * Send passwordless email sign-in link using Firebase Authentication
 */
export async function sendPasswordlessSignInLink(email: string, continuePath: string): Promise<void> {
  const origin = window.location.origin;
  const actionCodeSettings: ActionCodeSettings = {
    // URL to redirect back to. The URL must be whitelisted in the Firebase Console.
    url: `${origin}${continuePath}?emailSignIn=true`,
    handleCodeInApp: true,
  };
  await sendSignInLinkToEmail(auth, email.trim().toLowerCase(), actionCodeSettings);
  window.localStorage.setItem('onebite_email_for_sign_in', email.trim().toLowerCase());
}

/**
 * Check if the current URL is a Firebase email sign-in link
 */
export function isEmailSignInLink(url: string): boolean {
  return isSignInWithEmailLink(auth, url);
}

/**
 * Complete passwordless email sign-in with the received email link
 */
export async function signInWithEmailSignInLink(email: string, url: string): Promise<User | null> {
  const result = await signInWithEmailLink(auth, email.trim().toLowerCase(), url);
  window.localStorage.removeItem('onebite_email_for_sign_in');
  return result.user;
}

export {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  query,
  orderBy,
  where,
  onSnapshot,
  doc,
  collection,
  setDoc,
  updateDoc,
};
export type { User, ConfirmationResult, ActionCodeSettings };

