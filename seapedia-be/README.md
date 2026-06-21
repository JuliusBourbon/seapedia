# SEAPEDIA Backend API

SEAPEDIA is a multi-seller e-commerce platform connecting Buyers, Sellers, Drivers, and Admins in a single marketplace. This repository contains the backend API built with **Node.js (Express) + PostgreSQL + Prisma ORM**, featuring **JWT** authentication and **active role**-based access control.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Getting Started](#getting-started)
3. [Demo Accounts](#demo-accounts)
4. [Core Concepts](#core-concepts)
   - [Active Role & Multi-Role Login](#active-role--multi-role-login)
   - [Single-Store Checkout](#single-store-checkout)
   - [Vouchers & Promos (Discounts)](#vouchers--promos-discounts)
   - [Checkout Calculation (Subtotal, Discount, VAT, Total)](#checkout-calculation)
   - [Order Status Lifecycle](#order-status-lifecycle)
   - [Driver Earning Rules](#driver-earning-rules)
   - [Overdue Handling & Time Simulation](#overdue-handling--time-simulation)
5. [Security](#security)
6. [API Reference](#api-reference)
   - [Auth](#auth)
   - [Application Review](#application-review)
   - [Dashboard](#dashboard)
   - [Seller — Store](#seller--store)
   - [Seller — Products](#seller--products)
   - [Public Catalog](#public-catalog)
   - [Buyer — Wallet](#buyer--wallet)
   - [Buyer — Addresses](#buyer--addresses)
   - [Buyer — Cart](#buyer--cart)
   - [Checkout & Buyer Orders](#checkout--buyer-orders)
   - [Seller — Orders](#seller--orders)
   - [Discount — Voucher & Promo](#discount--voucher--promo)
   - [Reports](#reports)
   - [Driver — Delivery Jobs](#driver--delivery-jobs)
   - [Admin — Monitoring & Overdue](#admin--monitoring--overdue)
7. [End-to-End Testing Guide](#end-to-end-testing-guide)
8. [Security Testing Checklist](#security-testing-checklist)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend Framework | Node.js + Express.js |
| Database | PostgreSQL |
| ORM | Prisma (with `@prisma/adapter-pg`) |
| Auth | JWT (jsonwebtoken) + bcrypt |
| Validation | Zod |
| Input Sanitization | sanitize-html |
| Background Jobs | node-cron |
| Security Middleware | helmet, express-rate-limit |

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL (running locally or remote, `seapedia` database created)

### Installation

```bash
npm install
```

### `.env` Configuration

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/seapedia?schema=public"
JWT_SECRET="replace_with_a_long_random_secret"
JWT_EXPIRES_IN="7d"
PREAUTH_EXPIRES_IN="10m"
PORT=3000
```

### Database Migration & Seeding

```bash
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

The seed output will display a list of ready-to-use demo accounts (see [Demo Accounts](#demo-accounts)).

### Running the Server

```bash
npm run dev
```

The server runs at `http://localhost:3000`. Two background jobs run automatically:
- **Overdue checker** — every minute, checks orders that have exceeded their delivery SLA.
- **Token cleanup** — every day at 00:00, cleans up revoked & expired tokens.

### Data Reset (to retest from scratch)

```bash
npx prisma migrate reset
npx prisma db seed
```

---

## Demo Accounts

| Role | Username | Password | Notes |
|---|---|---|---|
| Admin | `admin` | `admin123` | Full access to `/admin/*` |
| Seller | `seller1` | `seller123` | Already owns a store **"Toko Demo Seapedia"** + 3 products |
| Buyer | `buyer1` | `buyer123` | Initial wallet **Rp1,000,000**, 1 default address available |
| Driver | `driver1` | `driver123` | No active jobs yet |
| Multi-role | `multirole1` | `multi123` | Roles **BUYER + SELLER** — use to demo the active role selection flow |

**Discount codes (from seed):**

| Code | Type | Value | Notes |
|---|---|---|---|
| `SEAVOUCHER10` | Voucher, PERCENTAGE | 10% | `usageLimit: 100` |
| `SEAPROMO5K` | Promo, FIXED | Rp5,000 | Unlimited usage |

---

## Core Concepts

### Active Role & Multi-Role Login

A single **non-admin** account (`username`) can have more than one role simultaneously (`BUYER`, `SELLER`, `DRIVER`). However, authorization for every request **always follows the `activeRole`** stored in the JWT payload — not the complete list of roles the user has.

**Login flow:**

1. `POST /auth/login` with `username` + `password`.
2. If the user is an `ADMIN`, or only has **1 role**, the response immediately returns:
   ```json
   { "requiresRoleSelection": false, "token": "...", "roles": [...], "activeRole": "BUYER" }
   ```
   This token is final and ready to use for other requests.
3. If the user has **>1 non-admin role**, the response returns:
   ```json
   { "requiresRoleSelection": true, "preAuthToken": "...", "roles": ["BUYER", "SELLER"] }
   ```
   The `preAuthToken` **does not yet** have an `activeRole` and is only valid for `PREAUTH_EXPIRES_IN` (default 10 minutes). The frontend must display a role selection page/modal.
4. Call `POST /auth/select-role` with the header `Authorization: Bearer <preAuthToken>` and body `{ "role": "SELLER" }` to get the final token populated with the `activeRole`.

Every private endpoint validates the `activeRole` on the backend using the `requireActiveRole(...)` middleware. If the `activeRole` does not match the required role for the endpoint, the server returns `403`, **regardless of other roles the user might own**.

---

### Single-Store Checkout

Since SEAPEDIA is a multi-seller marketplace, **a single cart can only contain products from one store**.

- When the first item is added to the cart, `cart.storeId` is automatically populated from `product.storeId`.
- If the buyer attempts to add a product from a different store when `cart.storeId` is already set and different, the server returns a **`409 Conflict`** with a message asking the buyer to empty their cart first (`DELETE /buyer/cart`).
- `cart.storeId` automatically reverts to `null` when the cart is empty (the last item is deleted, or after a successful checkout).

**The UI must explain this behavior** to the buyer, for example via a confirmation modal: *"Your cart contains products from another store. Empty your cart to proceed?"*

---

### Vouchers & Promos (Discounts)

Two types of discount codes that **cannot be combined** in a single checkout — only one `discountCode` is accepted per request.

| | Voucher | Promo |
|---|---|---|
| Unique fields | `expiryDate`, `usageLimit`, `usedCount` | `expiryDate` |
| Usage limit | Yes (global, `usedCount < usageLimit`) | None |
| Value type | `PERCENTAGE` or `FIXED` | `PERCENTAGE` or `FIXED` |

**Validation rules:**
- Expired codes (`expiryDate < now`) → rejected.
- Inactive codes `isActive: false` (disabled by admin) → rejected.
- Vouchers with `usedCount >= usageLimit` → rejected.
- Code search is sequential: **Voucher first**, then **Promo**. If the code is found in either table, the search stops.
- Validation results always include the field `source: "VOUCHER"` or `source: "PROMO"` so the frontend can display appropriate labels.

---

### Checkout Calculation

The following calculation sequence is **consistent** across the application (both for preview and final checkout endpoints):

```
1. subtotal           = Σ (product price × quantity)
2. discountAmount     = calculated from subtotal based on Voucher/Promo type
                         - PERCENTAGE: subtotal × value / 100
                         - FIXED: value
                         (capped at maximum of subtotal, rounded)
3. discountedSubtotal = subtotal - discountAmount
4. ppn                = 12% × discountedSubtotal   <-- VAT calculated AFTER discount
5. deliveryFee        = based on deliveryMethod
6. total              = discountedSubtotal + deliveryFee + ppn
```

**Delivery Fee:**

| Method | Fee |
|---|---|
| `INSTANT` | Rp25,000 |
| `NEXT_DAY` | Rp15,000 |
| `REGULAR` | Rp10,000 |

Use `POST /buyer/checkout/preview` to display this summary to the buyer **before** checkout confirmation (does not deduct from wallet, does not create an order).

---

### Order Status Lifecycle

```
SEDANG_DIKEMAS → MENUNGGU_PENGIRIM → SEDANG_DIKIRIM → PESANAN_SELESAI
                                                    ↘
                                              DIKEMBALIKAN  (overdue auto-return)
```

| Status | Trigger | Actor |
|---|---|---|
| `SEDANG_DIKEMAS` (Packing) | Successful checkout | Buyer |
| `MENUNGGU_PENGIRIM` (Awaiting Driver) | Order processed, delivery job created (`AVAILABLE`) | Seller |
| `SEDANG_DIKIRIM` (Delivering) | Driver picks up job (`take`) | Driver |
| `PESANAN_SELESAI` (Completed) | Driver confirms completion (`complete`) | Driver |
| `DIKEMBALIKAN` (Returned) | Order exceeds delivery SLA (overdue) | System (cron/admin) |

Every transition is recorded in the `OrderStatusHistory` table with a timestamp, viewable via the `statusHistory` field on `GET /buyer/orders/:id` and `GET /seller/orders`.

> **Note on the `status` field in Delivery vs Order response**: The endpoints `POST /driver/jobs/:id/take` and `/complete` return a **Delivery** object (`status: "TAKEN"` / `"COMPLETED"`), not an **Order** object. To view the actual Order status (`SEDANG_DIKIRIM` / `PESANAN_SELESAI`), use `GET /buyer/orders/:id` or `GET /seller/orders`.

---

### Driver Earning Rules

```
earning (per job) = order.deliveryFee
```

The `earning` value is saved directly on the `Delivery` record when the job is created (when the seller processes the order). A driver's total earnings are calculated by summing the `earning` of all `COMPLETED` `Delivery` records belonging to that driver — viewable via `GET /driver/earnings` or `GET /dashboard/driver/summary`.

---

### Overdue Handling & Time Simulation

**Delivery SLA** (calculated from `Order.createdAt`):

| Method | SLA |
|---|---|
| `INSTANT` | 3 hours |
| `NEXT_DAY` | 24 hours |
| `REGULAR` | 72 hours (3 days) |

If an order has **not** reached the `PESANAN_SELESAI` status when the current time exceeds `createdAt + SLA`, the order is automatically moved to the final status **`DIKEMBALIKAN`**.

**Auto-return effects** (within a single database transaction, idempotent):

1. `Order.status` → `DIKEMBALIKAN`, recorded in `OrderStatusHistory`.
2. **Refund**: `order.total` is fully refunded to the buyer's `Wallet`, recorded as a `WalletTransaction` of type `REFUND`.
3. **Stock**: every `OrderItem.quantity` is returned to `Product.stock`.
4. **Delivery**: related job (if `AVAILABLE`/`TAKEN`) is changed to `CANCELLED`.
5. Orders with `DIKEMBALIKAN` status are deducted from the Seller's `totalIncome` and moved to `totalReversedIncome`.

Orders already `DIKEMBALIKAN` or `PESANAN_SELESAI` **will not be reprocessed** — preventing double refund/restore.

**Time simulation** (without changing server time):

- The system stores `timeOffsetMs` in the `SystemSetting` table. All SLA checks use `now = Date.now() + timeOffsetMs`.
- `POST /admin/simulate-next-day` (Admin) adds an offset of **+24 hours** and immediately triggers an overdue check.
- In addition, **a cron job runs automatically every minute** to check & process overdue orders without manual intervention.

---

## Security

| Aspect | Implementation |
|---|---|
| **SQL Injection** | All database access uses Prisma Client (parameterized queries automatically). No unsafe raw queries. |
| **XSS** | Free text input (review comments, product/store names & descriptions, address fields) are sanitized via `sanitize-html` (`allowedTags: []`) before saving. |
| **Security Headers** | `helmet()` is applied globally. |
| **Input Validation** | All request bodies are validated with Zod (email, phone formats, 1-5 ratings, positive price/stock, discount percentage ≤100%, etc.) before entering the service layer. |
| **Rate Limiting** | `/auth/login` and `/auth/register` are limited to 20 requests/15 minutes per IP. |
| **Token Expiration** | Final token: 7 days (`JWT_EXPIRES_IN`). Pre-auth role token: 10 minutes (`PREAUTH_EXPIRES_IN`). |
| **Logout Invalidation** | Every token has a unique `jti`. Upon logout, the `jti` is saved to the `RevokedToken` table — that token is immediately rejected even if its signature & `exp` are still valid. |
| **Active Role Enforcement** | The `requireActiveRole(...)` middleware reads `activeRole` from the **JWT payload** (server-side), never trusting role info from the request body/header. |
| **Ownership Checks** | Products (`storeId`), Buyer orders (`buyerId`), Seller orders (`storeId`), delivery jobs (`driverId`), addresses (`userId`) — all are validated against `req.user.userId` in the service layer. |
| **Admin-Only Endpoints** | All `/admin/*` endpoints require `activeRole: ADMIN`. |

---

## API Reference

> Base URL: `http://localhost:3000/api/v1`
> Response format: `{ "success": boolean, "message": string, "data": object|array|null, "errors": object|null }`
> Authentication header: `Authorization: Bearer <token>`

### Auth

| Method | Endpoint | Auth | Body | Description |
|---|---|---|---|---|
| POST | `/auth/register` | - | `{ username, email, password, name, roles: ["BUYER"\|"SELLER"\|"DRIVER", ...] }` | Register a new user (ADMIN role cannot be publicly registered) |
| POST | `/auth/login` | - | `{ username, password }` | Login; see [Active Role & Multi-Role Login](#active-role--multi-role-login) |
| POST | `/auth/select-role` | Bearer `preAuthToken` | `{ role }` | Select active role for multi-role users |
| GET | `/auth/me` | Bearer token | - | Current user profile + `activeRole` |
| POST | `/auth/logout` | Bearer token | - | Revoke current token |

### Application Review

| Method | Endpoint | Auth | Body | Description |
|---|---|---|---|---|
| POST | `/reviews` | Optional | `{ reviewerName, rating (1-5), comment }` | Submit app review (guest or logged-in user) |
| GET | `/reviews` | - | - | List all reviews, newest first |

### Dashboard

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/dashboard/buyer/summary` | BUYER | Wallet balance, active orders, recent transactions |
| GET | `/dashboard/seller/summary` | SELLER | Store info, product count, pending orders |
| GET | `/dashboard/driver/summary` | DRIVER | Active jobs, completed jobs count, total earnings |
| GET | `/dashboard/admin/summary` | ADMIN | Marketplace summary |

### Seller — Store

| Method | Endpoint | Auth | Body | Description |
|---|---|---|---|---|
| GET | `/seller/store` | SELLER | - | Own store (`null` if not yet created) |
| POST | `/seller/store` | SELLER | `{ name, description? }` | Create store (fails `409` if name is taken/already owns a store) |
| PUT | `/seller/store` | SELLER | `{ name?, description? }` | Update own store |

### Seller — Products

| Method | Endpoint | Auth | Body | Description |
|---|---|---|---|---|
| GET | `/seller/products` | SELLER | - | List products owned by the store |
| POST | `/seller/products` | SELLER | `{ name, description?, price, stock }` | Create a new product |
| PUT | `/seller/products/:id` | SELLER | Partial fields above | Update product (own only, `403` if not) |
| DELETE | `/seller/products/:id` | SELLER | - | Delete product (own only) |

### Public Catalog

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/products` | - | List all products + store info |
| GET | `/products/:id` | - | Product details + store info |
| GET | `/stores/:id` | - | Store details + product list |

### Buyer — Wallet

| Method | Endpoint | Auth | Body | Description |
|---|---|---|---|---|
| GET | `/buyer/wallet` | BUYER | - | Wallet balance |
| POST | `/buyer/wallet/topup` | BUYER | `{ amount }` | Dummy top-up |
| GET | `/buyer/wallet/transactions` | BUYER | - | Transaction history (`TOPUP`, `PAYMENT`, `REFUND`) |

### Buyer — Addresses

| Method | Endpoint | Auth | Body | Description |
|---|---|---|---|---|
| GET | `/buyer/addresses` | BUYER | - | List addresses |
| POST | `/buyer/addresses` | BUYER | `{ label, recipientName, phoneNumber, fullAddress, city, postalCode, isDefault? }` | Add address (first is default) |
| PUT | `/buyer/addresses/:id` | BUYER | Partial fields above | Update own address |
| DELETE | `/buyer/addresses/:id` | BUYER | - | Delete own address |

### Buyer — Cart

> See [Single-Store Checkout](#single-store-checkout) for main rules.

| Method | Endpoint | Auth | Body | Description |
|---|---|---|---|---|
| GET | `/buyer/cart` | BUYER | - | Cart contents + summary (`totalItems`, `subtotal`) |
| POST | `/buyer/cart/items` | BUYER | `{ productId, quantity }` | Add product (`409` if different store) |
| PUT | `/buyer/cart/items/:productId` | BUYER | `{ quantity }` | Update quantity (`0` = remove item) |
| DELETE | `/buyer/cart/items/:productId` | BUYER | - | Remove item |
| DELETE | `/buyer/cart` | BUYER | - | Empty cart (resets `storeId`) |

### Checkout & Buyer Orders

> See [Checkout Calculation](#checkout-calculation).

| Method | Endpoint | Auth | Body | Description |
|---|---|---|---|---|
| POST | `/buyer/checkout/preview` | BUYER | `{ deliveryMethod, discountCode? }` | Calculate summary without creating an order |
| POST | `/buyer/checkout` | BUYER | `{ addressId, deliveryMethod, discountCode? }` | Create order (`400` if insufficient balance/stock) |
| GET | `/buyer/orders` | BUYER | - | Order history |
| GET | `/buyer/orders/:id` | BUYER | - | Order details + `statusHistory` + `delivery` |

### Seller — Orders

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/seller/orders` | SELLER | Incoming orders for own store |
| PATCH | `/seller/orders/:id/process` | SELLER | `SEDANG_DIKEMAS` → `MENUNGGU_PENGIRIM`, creates delivery job |

### Discount — Voucher & Promo

> See [Vouchers & Promos (Discounts)](#vouchers--promos-discounts).

| Method | Endpoint | Auth | Body | Description |
|---|---|---|---|---|
| POST | `/admin/vouchers` | ADMIN | `{ code, type, value, expiryDate, usageLimit }` | Create voucher |
| GET | `/vouchers` | - | - | List vouchers |
| GET | `/vouchers/:code` | - | - | Voucher details |
| PATCH | `/admin/vouchers/:code/toggle` | ADMIN | - | Toggle `isActive` |
| POST | `/admin/promos` | ADMIN | `{ code, type, value, expiryDate }` | Create promo |
| GET | `/promos` | - | - | List promos |
| GET | `/promos/:code` | - | - | Promo details |
| PATCH | `/admin/promos/:code/toggle` | ADMIN | - | Toggle `isActive` |

### Reports

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/buyer/reports/summary` | BUYER | `totalSpending`, `totalDiscount`, `totalRefunded`, `statusBreakdown` |
| GET | `/seller/reports/summary` | SELLER | `totalIncome`, `totalReversedIncome`, `statusBreakdown` |

### Driver — Delivery Jobs

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/driver/jobs` | DRIVER | List `AVAILABLE` jobs (order = `MENUNGGU_PENGIRIM`) |
| GET | `/driver/jobs/active` | DRIVER | Currently taken jobs (`TAKEN`) |
| GET | `/driver/jobs/history` | DRIVER | Completed jobs (`COMPLETED`) |
| GET | `/driver/jobs/:id` | DRIVER | Job details + order |
| POST | `/driver/jobs/:id/take` | DRIVER | Take job (`409` if taken by another driver) |
| POST | `/driver/jobs/:id/complete` | DRIVER | Complete job (`403` if not own job) |
| GET | `/driver/earnings` | DRIVER | `totalCompletedJobs`, `totalEarnings` |

### Admin — Monitoring & Overdue

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/admin/summary` | ADMIN | Count summary of users/stores/products/orders/vouchers/promos/deliveries/overdue |
| GET | `/admin/users` | ADMIN | Monitor users + roles |
| GET | `/admin/stores` | ADMIN | Monitor stores |
| GET | `/admin/products` | ADMIN | Monitor products |
| GET | `/admin/orders` | ADMIN | Monitor all orders |
| GET | `/admin/deliveries` | ADMIN | Monitor delivery jobs |
| GET | `/admin/overdue` | ADMIN | Orders past SLA + `DIKEMBALIKAN` history |
| POST | `/admin/overdue/run` | ADMIN | Manual trigger overdue check |
| POST | `/admin/simulate-next-day` | ADMIN | Fast-forward time +24 hours & run overdue check |

---

## End-to-End Testing Guide

Full demo flow using demo accounts:

1. **Buyer** (`buyer1`): top-up wallet → check default address → add products from `Toko Demo Seapedia` to cart.
2. `POST /buyer/checkout/preview` with `discountCode: "SEAVOUCHER10"` → check `discount`, `ppn`, `total`.
3. `POST /buyer/checkout` → new order, status `SEDANG_DIKEMAS` (Packing).
4. **Seller** (`seller1`): `GET /seller/orders` → `PATCH /seller/orders/:id/process` → status `MENUNGGU_PENGIRIM` (Awaiting Driver), delivery job created.
5. **Driver** (`driver1`): `GET /driver/jobs` → `POST /driver/jobs/:id/take` (order → `SEDANG_DIKIRIM`) → `POST /driver/jobs/:id/complete` (order → `PESANAN_SELESAI`).
6. **Buyer**: `GET /buyer/orders/:id` → check complete `statusHistory`; `GET /buyer/reports/summary`.
7. **Seller**: `GET /seller/reports/summary` → `totalIncome` increases.
8. **Driver**: `GET /driver/earnings` → `totalEarnings` increases by `deliveryFee`.
9. **Overdue demo**: create a new order with `deliveryMethod: "INSTANT"`, **do not** process as seller. Login as **Admin** → `POST /admin/simulate-next-day` → `GET /admin/overdue` → order becomes `DIKEMBALIKAN`, buyer wallet refunded, product stock restored.
10. **Multi-role demo**: login as `multirole1` → `requiresRoleSelection: true` → `POST /auth/select-role` with `role: "SELLER"` or `"BUYER"`.

---

## Security Testing Checklist

| # | Scenario | Expected Result |
|---|---|---|
| 1 | `POST /reviews` with `comment: "<script>alert(1)</script>Awesome"` | `<script>` tag is not saved/executed as active HTML |
| 2 | `POST /seller/products` with `name` containing `<img onerror=...>` | Tag is removed from saved result |
| 3 | `POST /auth/login` with `username: "admin' OR '1'='1"` | `401 Invalid username or password` (not an SQL error/bypass) |
| 4 | `POST /auth/logout` then use the same token for `GET /auth/me` | `401 Token has been revoked` |
| 5 | Token `activeRole: BUYER` accessing `POST /seller/products` | `403 Forbidden` |
| 6 | Buyer A Token accessing `GET /buyer/orders/:id` belonging to Buyer B | `404 Order not found` |
| 7 | Seller A Token accessing `PUT /seller/products/:id` belonging to Seller B | `403 Forbidden` |
| 8 | Non-admin token accessing `GET /admin/users` | `403 Forbidden` |
| 9 | `POST /auth/login` fails repeatedly >20x in 15 minutes | `429 Too Many Requests` |
| 10 | `POST /admin/vouchers` with `type: "PERCENTAGE", value: 150` | `400` (exceeds 100%) |
| 11 | `POST /buyer/addresses` with `phoneNumber: "abc"` | `400` with `errors.phoneNumber` |
