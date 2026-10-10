# One Bite Motihari - Firestore Security Specifications

## 1. Data Invariants
1. **Public Read-Only Catalog**: Settings, Categories, Menu Items, Gallery, Reviews, Offers, and Business Hours are publicly viewable by visitors, but can ONLY be created, updated, or deleted by authenticated Administrators.
2. **Order Placement & Protection**: Customers (or anonymous/guest users) can create orders. However, customers cannot modify orders after placement or change statuses to arbitrary values. Only Admins can update order status (e.g. preparing, completed, cancelled) or delete orders.
3. **Immutable Identity & Dates**: Order `createdAt`, MenuItem `createdAt`, Category `createdAt` are immutable once written.
4. **Admin Protection**: Only authorized emails (e.g. `npaditya53@gmail.com`) or users in `/admins/{adminId}` can perform administrative mutations on the restaurant catalog and order statuses.
5. **ID & Payload Sanitization**: Document IDs must conform to `isValidId` (`size <= 128` and matching `^[a-zA-Z0-9_-]+$`).

## 2. The Dirty Dozen Payloads
1. **Unauthenticated Category Creation**: Malicious actor posts `{ "name": "Hacked", "slug": "hacked" }` to `/categories/hack1` -> DENIED.
2. **Unauthenticated Menu Modification**: Direct PATCH to `/menuItems/item1` setting `price: 1` -> DENIED.
3. **Admin Privilege Escalation**: Non-admin writes `{ "email": "attacker@evil.com", "role": "admin" }` to `/admins/attacker` -> DENIED.
4. **Order Status Tampering**: Guest modifies `orders/ord123` setting `status: "completed"` without admin auth -> DENIED.
5. **Order Injection Attack**: Guest creates order with missing customerName and negative totalAmount -> DENIED.
6. **Oversized String Payload Attack (Denial of Wallet)**: Injecting 2MB string into category description -> DENIED.
7. **Document ID Poisoning**: Document ID with path traversal `../users/1` or non-alphanumeric special characters -> DENIED.
8. **Tampering with Immutable Timestamps**: Modifying `createdAt` on an existing order or menu item -> DENIED.
9. **Unauthenticated Review Deletion**: Attempting DELETE on `/reviews/rev1` -> DENIED.
10. **Unauthenticated Gallery Overwrite**: Overwriting photo captions or image URLs without admin privileges -> DENIED.
11. **Settings Tampering**: Modifying restaurant phone number, UPI QR, or bank details by non-admin -> DENIED.
12. **Catch-All Default Deny**: Querying or writing to any undefined root collection `/secret_data` -> DENIED.
