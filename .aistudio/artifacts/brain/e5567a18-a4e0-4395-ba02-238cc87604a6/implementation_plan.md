# Implementation Plan - PWA Permissions & Device Integration System

This plan outlines the steps to implement a complete permission management and device integration system for ONE BITE, including Push Notifications (FCM), Location, Camera, Microphone, and File access.

## Stage 1: Permission Management System
- Create `src/context/PermissionContext.tsx` to track and manage permission states (granted, denied, prompt).
- Implement `src/components/common/PermissionModal.tsx`: A premium ONE BITE branded modal that explains permission needs.
- Add a "Permissions & Notifications" section to the customer settings page.

## Stage 2: Push Notifications (FCM) Setup
- **Firebase Configuration**:
    - Add `VITE_FIREBASE_VAPID_KEY` to `.env.example`.
    - Initialize FCM in `src/services/firebase.ts`.
- **Service Worker**:
    - Create `src/sw.ts` (or `public/firebase-messaging-sw.js`) to handle background notifications.
    - Update `vite.config.ts` to integrate FCM logic into the PWA Service Worker.
- **Token Management**:
    - Add `POST /api/notifications/subscribe` to `server.ts` to store FCM tokens in Firestore collection `deviceSubscriptions`.
    - Implement token refresh logic in the frontend.

## Stage 3: Device Features Integration
- **Location**:
    - Add "Detect My Location" button in `src/components/checkout/CheckoutForm.tsx`.
    - Use Geolocation API to fetch coordinates and reverse-geocode if possible (or just use coords).
- **Camera**:
    - Implement `src/components/common/QRScanner.tsx` using `navigator.mediaDevices.getUserMedia`.
    - Use for scanning table QRs or special offer codes.
- **Microphone**:
    - Implement an optional "Voice Search" in the menu using the MediaDevices API.
- **Photos & Files**:
    - Update user profile or review submission to include a secure file picker with image previews.

## Stage 4: Admin Panel & Backend
- **Admin Dashboard**:
    - Add "Notifications" section to compose and send broadcast or targeted notifications.
    - View subscriber statistics.
- **Backend Notifications**:
    - Implement a helper in `server.ts` to send notifications using `firebase-admin`.
    - Trigger notifications on order status changes (placed, confirmed, prepared, out for delivery).

## Stage 5: Testing & Security
- Hardened Firestore rules for `deviceSubscriptions`.
- Verify PWA installability and offline support remains intact.
- Test across Android Chrome and desktop browsers.

## Verification Checklist
- [ ] Permission modal appears only on user action.
- [ ] FCM tokens are stored securely and associated with users.
- [ ] Background/Foreground notifications work.
- [ ] Location detection is accurate and opt-in.
- [ ] Camera/Microphone tracks are stopped after use.
- [ ] Admin can send promotional notifications.
