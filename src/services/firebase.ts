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
  updateDoc
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { isRestaurantOpen } from '../utils/operatingHours.ts';

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
  startedAt?: string
): Promise<void> {
  const orderRef = doc(db, 'orders', String(orderId));
  await updateDoc(orderRef, {
    status: 'out_for_delivery',
    deliveryStatus: 'Out for Delivery',
    startedDeliveryAt: startedAt || new Date().toISOString(),
  });
}

/**
 * Confirm order delivered in Firebase Firestore
 */
export async function markOrderDeliveredInFirestore(
  orderId: string,
  deliveryData: { deliveredBy?: string; deliveredAt?: string }
): Promise<void> {
  const orderRef = doc(db, 'orders', String(orderId));
  const updateData = {
    status: 'delivered',
    deliveryStatus: 'Delivered',
    deliveredAt: deliveryData.deliveredAt || new Date().toISOString(),
    deliveredBy: deliveryData.deliveredBy || 'One Bite Delivery Partner',
  };
  await updateDoc(orderRef, updateData);
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
 * Update order status and statusHistory in Firebase Firestore
 */
export async function updateOrderStatusInFirestore(
  orderId: string,
  newStatus: string,
  options: {
    note?: string;
    updatedBy?: string;
    paymentStatus?: 'unpaid' | 'paid';
  } = {}
): Promise<void> {
  const orderRef = doc(db, 'orders', String(orderId));
  const nowIso = new Date().toISOString();
  const updatePayload: Record<string, any> = {
    status: newStatus,
  };

  if (options.paymentStatus) {
    updatePayload.paymentStatus = options.paymentStatus;
  }

  if (newStatus === 'packed') {
    updatePayload.deliveryStatus = 'Packed';
    updatePayload.packedAt = nowIso;
  } else if (newStatus === 'out_for_delivery') {
    updatePayload.deliveryStatus = 'Out for Delivery';
    updatePayload.startedDeliveryAt = nowIso;
  } else if (newStatus === 'delivered') {
    updatePayload.deliveryStatus = 'Delivered';
    updatePayload.deliveredAt = nowIso;
    updatePayload.deliveredBy = options.updatedBy || 'Admin Console';
  }

  // Fetch current doc to append statusHistory safely
  try {
    const currentSnap = await getDocFromServer(orderRef);
    if (currentSnap.exists()) {
      const existingData = currentSnap.data();
      const existingHistory = Array.isArray(existingData.statusHistory) ? existingData.statusHistory : [];
      updatePayload.statusHistory = [
        ...existingHistory,
        {
          status: newStatus,
          timestamp: nowIso,
          updatedBy: options.updatedBy || 'Admin Console',
          note: options.note || undefined,
        },
      ];
    }
  } catch (e) {
    console.warn('Could not read existing doc for statusHistory:', e);
  }

  await updateDoc(orderRef, updatePayload);
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

