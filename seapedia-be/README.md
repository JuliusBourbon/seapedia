# SEAPEDIA Backend API

SEAPEDIA adalah platform e-commerce multi-seller yang menghubungkan Buyer, Seller, Driver, dan Admin dalam satu marketplace. Repository ini berisi backend API berbasis **Node.js (Express) + PostgreSQL + Prisma ORM**, dengan autentikasi **JWT** dan kontrol akses berbasis **active role**.

---

## Daftar Isi

1. [Tech Stack](#tech-stack)
2. [Getting Started](#getting-started)
3. [Demo Accounts](#demo-accounts)
4. [Konsep Inti](#konsep-inti)
   - [Active Role & Multi-Role Login](#active-role--multi-role-login)
   - [Single-Store Checkout](#single-store-checkout)
   - [Voucher & Promo (Diskon)](#voucher--promo-diskon)
   - [Kalkulasi Checkout (Subtotal, Diskon, PPN, Total)](#kalkulasi-checkout)
   - [Order Status Lifecycle](#order-status-lifecycle)
   - [Driver Earning Rule](#driver-earning-rule)
   - [Overdue Handling & Time Simulation](#overdue-handling--time-simulation)
5. [Keamanan](#keamanan)
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

| Layer | Teknologi |
|---|---|
| Backend Framework | Node.js + Express.js |
| Database | PostgreSQL |
| ORM | Prisma (dengan `@prisma/adapter-pg`) |
| Auth | JWT (jsonwebtoken) + bcrypt |
| Validasi | Zod |
| Sanitasi Input | sanitize-html |
| Background Jobs | node-cron |
| Security Middleware | helmet, express-rate-limit |

---

## Getting Started

### Prasyarat

- Node.js 18+
- PostgreSQL (sudah berjalan, database `seapedia` sudah dibuat)

### Instalasi

```bash
npm install
```

### Konfigurasi `.env`

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/seapedia?schema=public"
JWT_SECRET="ganti_dengan_secret_panjang_dan_acak"
JWT_EXPIRES_IN="7d"
PREAUTH_EXPIRES_IN="10m"
PORT=3000
```

### Migrasi & Seed Database

```bash
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

Output seed akan menampilkan daftar demo account yang siap dipakai (lihat [Demo Accounts](#demo-accounts)).

### Menjalankan Server

```bash
npm run dev
```

Server berjalan di `http://localhost:3000`. Dua background job otomatis berjalan:
- **Overdue checker** — setiap menit, memeriksa order yang melewati SLA pengiriman.
- **Token cleanup** — setiap hari jam 00:00, membersihkan token yang sudah revoked & expired.

### Reset Data (untuk testing ulang dari awal)

```bash
npx prisma migrate reset
npx prisma db seed
```

---

## Demo Accounts

| Role | Username | Password | Catatan |
|---|---|---|---|
| Admin | `admin` | `admin123` | Akses penuh `/admin/*` |
| Seller | `seller1` | `seller123` | Sudah punya toko **"Toko Demo Seapedia"** + 3 produk |
| Buyer | `buyer1` | `buyer123` | Wallet awal **Rp1.000.000**, sudah ada 1 alamat default |
| Driver | `driver1` | `driver123` | Belum ada job aktif |
| Multi-role | `multirole1` | `multi123` | Roles **BUYER + SELLER** — gunakan untuk demo flow pemilihan active role |

**Kode diskon (dari seed):**

| Code | Tipe | Nilai | Catatan |
|---|---|---|---|
| `SEAVOUCHER10` | Voucher, PERCENTAGE | 10% | `usageLimit: 100` |
| `SEAPROMO5K` | Promo, FIXED | Rp5.000 | Tanpa batas pemakaian |

---

## Konsep Inti

### Active Role & Multi-Role Login

Satu username **non-admin** (`username`) dapat memiliki lebih dari satu role sekaligus (`BUYER`, `SELLER`, `DRIVER`). Namun otorisasi di setiap request **selalu mengikuti `activeRole`** yang tersimpan di dalam JWT payload — bukan daftar lengkap role yang dimiliki user.

**Alur login:**

1. `POST /auth/login` dengan `username` + `password`.
2. Jika user adalah `ADMIN`, atau hanya memiliki **1 role**, response langsung berisi:
   ```json
   { "requiresRoleSelection": false, "token": "...", "roles": [...], "activeRole": "BUYER" }
   ```
   Token ini sudah final dan siap dipakai untuk request lain.
3. Jika user memiliki **>1 role non-admin**, response berisi:
   ```json
   { "requiresRoleSelection": true, "preAuthToken": "...", "roles": ["BUYER", "SELLER"] }
   ```
   `preAuthToken` **belum** memiliki `activeRole` dan hanya berlaku selama `PREAUTH_EXPIRES_IN` (default 10 menit). Frontend wajib menampilkan halaman/modal pemilihan role.
4. Panggil `POST /auth/select-role` dengan header `Authorization: Bearer <preAuthToken>` dan body `{ "role": "SELLER" }` untuk mendapatkan token final dengan `activeRole` terisi.

Setiap endpoint privat memvalidasi `activeRole` di backend menggunakan middleware `requireActiveRole(...)`. Jika `activeRole` tidak sesuai dengan role yang dibutuhkan endpoint, server mengembalikan `403`, **terlepas dari role lain yang dimiliki user tersebut**.

---

### Single-Store Checkout

Karena SEAPEDIA adalah marketplace multi-seller, **satu cart hanya boleh berisi produk dari satu toko**.

- Saat item pertama ditambahkan ke cart, `cart.storeId` otomatis diisi dari `product.storeId`.
- Jika buyer mencoba menambahkan produk dari toko lain saat `cart.storeId` sudah terisi dan berbeda, server mengembalikan **`409 Conflict`** dengan pesan yang meminta buyer mengosongkan cart terlebih dahulu (`DELETE /buyer/cart`).
- `cart.storeId` otomatis kembali menjadi `null` saat cart kosong (item terakhir dihapus, atau setelah checkout berhasil).

**UI wajib menjelaskan perilaku ini** kepada buyer, misalnya melalui modal konfirmasi: *"Cart Anda berisi produk dari toko lain. Kosongkan cart untuk melanjutkan?"*

---

### Voucher & Promo (Diskon)

Dua jenis kode diskon yang **tidak dapat dikombinasikan** dalam satu checkout — hanya satu `discountCode` yang diterima per request.

| | Voucher | Promo |
|---|---|---|
| Field unik | `expiryDate`, `usageLimit`, `usedCount` | `expiryDate` |
| Batas pemakaian | Ya (global, `usedCount < usageLimit`) | Tidak ada |
| Tipe nilai | `PERCENTAGE` atau `FIXED` | `PERCENTAGE` atau `FIXED` |

**Aturan validasi:**
- Kode kadaluarsa (`expiryDate < now`) → ditolak.
- Kode `isActive: false` (dinonaktifkan admin) → ditolak.
- Voucher dengan `usedCount >= usageLimit` → ditolak.
- Pencarian kode dilakukan berurutan: **Voucher dulu**, baru **Promo**. Jika kode ditemukan di salah satu tabel, pencarian berhenti.
- Hasil validasi selalu menyertakan field `source: "VOUCHER"` atau `source: "PROMO"` agar frontend bisa menampilkan label yang sesuai.

---

### Kalkulasi Checkout

Urutan kalkulasi berikut **konsisten** di seluruh aplikasi (endpoint preview maupun checkout final):

```
1. subtotal           = Σ (harga produk × quantity)
2. discountAmount     = dihitung dari subtotal berdasarkan type Voucher/Promo
                         - PERCENTAGE: subtotal × value / 100
                         - FIXED: value
                         (dibatasi maksimal sebesar subtotal, dibulatkan)
3. discountedSubtotal = subtotal - discountAmount
4. ppn                = 12% × discountedSubtotal   <-- PPN dihitung SETELAH diskon
5. deliveryFee        = berdasarkan deliveryMethod
6. total              = discountedSubtotal + deliveryFee + ppn
```

**Delivery Fee:**

| Metode | Biaya |
|---|---|
| `INSTANT` | Rp25.000 |
| `NEXT_DAY` | Rp15.000 |
| `REGULAR` | Rp10.000 |

Gunakan `POST /buyer/checkout/preview` untuk menampilkan ringkasan ini ke buyer **sebelum** konfirmasi checkout (tidak memotong wallet, tidak membuat order).

---

### Order Status Lifecycle

```
SEDANG_DIKEMAS → MENUNGGU_PENGIRIM → SEDANG_DIKIRIM → PESANAN_SELESAI
                                                    ↘
                                              DIKEMBALIKAN  (overdue auto-return)
```

| Status | Trigger | Aktor |
|---|---|---|
| `SEDANG_DIKEMAS` | Checkout berhasil | Buyer |
| `MENUNGGU_PENGIRIM` | Order diproses, delivery job dibuat (`AVAILABLE`) | Seller |
| `SEDANG_DIKIRIM` | Driver mengambil job (`take`) | Driver |
| `PESANAN_SELESAI` | Driver konfirmasi selesai (`complete`) | Driver |
| `DIKEMBALIKAN` | Order melewati SLA pengiriman (overdue) | Sistem (cron/admin) |

Setiap transisi tercatat di tabel `OrderStatusHistory` dengan timestamp, dapat dilihat melalui field `statusHistory` pada `GET /buyer/orders/:id` dan `GET /seller/orders`.

> **Catatan field `status` pada response Delivery vs Order**: endpoint `POST /driver/jobs/:id/take` dan `/complete` mengembalikan objek **Delivery** (`status: "TAKEN"` / `"COMPLETED"`), bukan objek **Order**. Untuk melihat status Order yang sebenarnya (`SEDANG_DIKIRIM` / `PESANAN_SELESAI`), gunakan `GET /buyer/orders/:id` atau `GET /seller/orders`.

---

### Driver Earning Rule

```
earning (per job) = order.deliveryFee
```

Nilai `earning` disimpan langsung pada record `Delivery` saat job dibuat (saat seller memproses order). Total earning driver dihitung dari penjumlahan `earning` seluruh `Delivery` berstatus `COMPLETED` milik driver tersebut — dapat dilihat melalui `GET /driver/earnings` atau `GET /dashboard/driver/summary`.

---

### Overdue Handling & Time Simulation

**SLA pengiriman** (dihitung dari `Order.createdAt`):

| Metode | SLA |
|---|---|
| `INSTANT` | 3 jam |
| `NEXT_DAY` | 24 jam |
| `REGULAR` | 72 jam (3 hari) |

Jika sebuah order **belum** berstatus `PESANAN_SELESAI` saat waktu sekarang melewati `createdAt + SLA`, order otomatis dipindahkan ke status final **`DIKEMBALIKAN`**.

**Efek auto-return** (dalam satu database transaction, idempotent):

1. `Order.status` → `DIKEMBALIKAN`, tercatat di `OrderStatusHistory`.
2. **Refund**: `order.total` dikembalikan penuh ke `Wallet` buyer, tercatat sebagai `WalletTransaction` tipe `REFUND`.
3. **Stok**: setiap `OrderItem.quantity` dikembalikan ke `Product.stock`.
4. **Delivery**: job terkait (jika `AVAILABLE`/`TAKEN`) diubah menjadi `CANCELLED`.
5. Order dengan status `DIKEMBALIKAN` dikeluarkan dari `totalIncome` Seller dan dipindahkan ke `totalReversedIncome`.

Order yang sudah `DIKEMBALIKAN` atau `PESANAN_SELESAI` **tidak akan diproses ulang** — mencegah double refund/restore.

**Simulasi waktu** (tanpa mengubah jam server):

- Sistem menyimpan `timeOffsetMs` di tabel `SystemSetting`. Seluruh pengecekan SLA menggunakan `now = Date.now() + timeOffsetMs`.
- `POST /admin/simulate-next-day` (Admin) menambah offset **+24 jam** dan langsung memicu pengecekan overdue.
- Selain itu, **cron job berjalan otomatis setiap menit** untuk memeriksa & memproses order overdue tanpa intervensi manual.

---

## Keamanan

| Aspek | Implementasi |
|---|---|
| **SQL Injection** | Seluruh akses database menggunakan Prisma Client (parameterized query secara otomatis). Tidak ada raw query unsafe. |
| **XSS** | Input teks bebas (review comment, nama/deskripsi produk & toko, field alamat) disanitasi via `sanitize-html` (`allowedTags: []`) sebelum disimpan. |
| **Security Headers** | `helmet()` dipasang global. |
| **Validasi Input** | Seluruh body request divalidasi dengan Zod (email, format telepon, rating 1-5, price/stock positif, persentase diskon ≤100%, dll) sebelum masuk service layer. |
| **Rate Limiting** | `/auth/login` dan `/auth/register` dibatasi 20 request/15 menit per IP. |
| **Token Expiration** | Token final: 7 hari (`JWT_EXPIRES_IN`). Token pra-pemilihan role: 10 menit (`PREAUTH_EXPIRES_IN`). |
| **Logout Invalidation** | Setiap token memiliki `jti` unik. Saat logout, `jti` disimpan ke tabel `RevokedToken` — token tersebut langsung ditolak meski signature & `exp` masih valid. |
| **Active Role Enforcement** | Middleware `requireActiveRole(...)` membaca `activeRole` dari **JWT payload** (server-side), tidak pernah mempercayai informasi role dari body/header request. |
| **Ownership Checks** | Produk (`storeId`), order Buyer (`buyerId`), order Seller (`storeId`), delivery job (`driverId`), alamat (`userId`) — seluruhnya divalidasi terhadap `req.user.userId` di service layer. |
| **Admin-Only Endpoints** | Seluruh `/admin/*` memerlukan `activeRole: ADMIN`. |

---

## API Reference

> Base URL: `http://localhost:3000/api/v1`
> Format response: `{ "success": boolean, "message": string, "data": object|array|null, "errors": object|null }`
> Header autentikasi: `Authorization: Bearer <token>`

### Auth

| Method | Endpoint | Auth | Body | Deskripsi |
|---|---|---|---|---|
| POST | `/auth/register` | - | `{ username, email, password, name, roles: ["BUYER"\|"SELLER"\|"DRIVER", ...] }` | Registrasi user baru (role ADMIN tidak bisa didaftarkan publik) |
| POST | `/auth/login` | - | `{ username, password }` | Login; lihat [Active Role & Multi-Role Login](#active-role--multi-role-login) |
| POST | `/auth/select-role` | Bearer `preAuthToken` | `{ role }` | Pilih active role untuk user multi-role |
| GET | `/auth/me` | Bearer token | - | Profil user saat ini + `activeRole` |
| POST | `/auth/logout` | Bearer token | - | Revoke token saat ini |

### Application Review

| Method | Endpoint | Auth | Body | Deskripsi |
|---|---|---|---|---|
| POST | `/reviews` | Opsional | `{ reviewerName, rating (1-5), comment }` | Submit review aplikasi (guest atau user login) |
| GET | `/reviews` | - | - | List seluruh review, terbaru dulu |

### Dashboard

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | `/dashboard/buyer/summary` | BUYER | Wallet balance, order aktif, transaksi terakhir |
| GET | `/dashboard/seller/summary` | SELLER | Info toko, jumlah produk, pending orders |
| GET | `/dashboard/driver/summary` | DRIVER | Job aktif, jumlah job selesai, total earnings |
| GET | `/dashboard/admin/summary` | ADMIN | Ringkasan marketplace |

### Seller — Store

| Method | Endpoint | Auth | Body | Deskripsi |
|---|---|---|---|---|
| GET | `/seller/store` | SELLER | - | Toko milik sendiri (`null` jika belum punya) |
| POST | `/seller/store` | SELLER | `{ name, description? }` | Buat toko (gagal `409` jika nama dipakai/sudah punya toko) |
| PUT | `/seller/store` | SELLER | `{ name?, description? }` | Update toko sendiri |

### Seller — Products

| Method | Endpoint | Auth | Body | Deskripsi |
|---|---|---|---|---|
| GET | `/seller/products` | SELLER | - | List produk milik toko sendiri |
| POST | `/seller/products` | SELLER | `{ name, description?, price, stock }` | Buat produk baru |
| PUT | `/seller/products/:id` | SELLER | sebagian field di atas | Update produk (hanya milik sendiri, `403` jika bukan) |
| DELETE | `/seller/products/:id` | SELLER | - | Hapus produk (hanya milik sendiri) |

### Public Catalog

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | `/products` | - | List seluruh produk + info toko |
| GET | `/products/:id` | - | Detail produk + info toko |
| GET | `/stores/:id` | - | Detail toko + daftar produknya |

### Buyer — Wallet

| Method | Endpoint | Auth | Body | Deskripsi |
|---|---|---|---|---|
| GET | `/buyer/wallet` | BUYER | - | Saldo wallet |
| POST | `/buyer/wallet/topup` | BUYER | `{ amount }` | Top-up dummy |
| GET | `/buyer/wallet/transactions` | BUYER | - | Riwayat transaksi (`TOPUP`, `PAYMENT`, `REFUND`) |

### Buyer — Addresses

| Method | Endpoint | Auth | Body | Deskripsi |
|---|---|---|---|---|
| GET | `/buyer/addresses` | BUYER | - | List alamat |
| POST | `/buyer/addresses` | BUYER | `{ label, recipientName, phoneNumber, fullAddress, city, postalCode, isDefault? }` | Tambah alamat (pertama otomatis default) |
| PUT | `/buyer/addresses/:id` | BUYER | sebagian field di atas | Update alamat sendiri |
| DELETE | `/buyer/addresses/:id` | BUYER | - | Hapus alamat sendiri |

### Buyer — Cart

> Lihat [Single-Store Checkout](#single-store-checkout) untuk aturan utama.

| Method | Endpoint | Auth | Body | Deskripsi |
|---|---|---|---|---|
| GET | `/buyer/cart` | BUYER | - | Isi cart + summary (`totalItems`, `subtotal`) |
| POST | `/buyer/cart/items` | BUYER | `{ productId, quantity }` | Tambah produk (`409` jika beda toko) |
| PUT | `/buyer/cart/items/:productId` | BUYER | `{ quantity }` | Update quantity (`0` = hapus item) |
| DELETE | `/buyer/cart/items/:productId` | BUYER | - | Hapus item |
| DELETE | `/buyer/cart` | BUYER | - | Kosongkan cart (reset `storeId`) |

### Checkout & Buyer Orders

> Lihat [Kalkulasi Checkout](#kalkulasi-checkout).

| Method | Endpoint | Auth | Body | Deskripsi |
|---|---|---|---|---|
| POST | `/buyer/checkout/preview` | BUYER | `{ deliveryMethod, discountCode? }` | Hitung ringkasan tanpa membuat order |
| POST | `/buyer/checkout` | BUYER | `{ addressId, deliveryMethod, discountCode? }` | Buat order (`400` jika saldo/stok kurang) |
| GET | `/buyer/orders` | BUYER | - | Riwayat order |
| GET | `/buyer/orders/:id` | BUYER | - | Detail order + `statusHistory` + `delivery` |

### Seller — Orders

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | `/seller/orders` | SELLER | Order masuk untuk toko sendiri |
| PATCH | `/seller/orders/:id/process` | SELLER | `SEDANG_DIKEMAS` → `MENUNGGU_PENGIRIM`, membuat delivery job |

### Discount — Voucher & Promo

> Lihat [Voucher & Promo (Diskon)](#voucher--promo-diskon).

| Method | Endpoint | Auth | Body | Deskripsi |
|---|---|---|---|---|
| POST | `/admin/vouchers` | ADMIN | `{ code, type, value, expiryDate, usageLimit }` | Buat voucher |
| GET | `/vouchers` | - | - | List voucher |
| GET | `/vouchers/:code` | - | - | Detail voucher |
| PATCH | `/admin/vouchers/:code/toggle` | ADMIN | - | Toggle `isActive` |
| POST | `/admin/promos` | ADMIN | `{ code, type, value, expiryDate }` | Buat promo |
| GET | `/promos` | - | - | List promo |
| GET | `/promos/:code` | - | - | Detail promo |
| PATCH | `/admin/promos/:code/toggle` | ADMIN | - | Toggle `isActive` |

### Reports

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | `/buyer/reports/summary` | BUYER | `totalSpending`, `totalDiscount`, `totalRefunded`, `statusBreakdown` |
| GET | `/seller/reports/summary` | SELLER | `totalIncome`, `totalReversedIncome`, `statusBreakdown` |

### Driver — Delivery Jobs

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | `/driver/jobs` | DRIVER | List job `AVAILABLE` (order = `MENUNGGU_PENGIRIM`) |
| GET | `/driver/jobs/active` | DRIVER | Job yang sedang dikerjakan (`TAKEN`) |
| GET | `/driver/jobs/history` | DRIVER | Job yang sudah `COMPLETED` |
| GET | `/driver/jobs/:id` | DRIVER | Detail job + order |
| POST | `/driver/jobs/:id/take` | DRIVER | Ambil job (`409` jika sudah diambil driver lain) |
| POST | `/driver/jobs/:id/complete` | DRIVER | Selesaikan job (`403` jika bukan job sendiri) |
| GET | `/driver/earnings` | DRIVER | `totalCompletedJobs`, `totalEarnings` |

### Admin — Monitoring & Overdue

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | `/admin/summary` | ADMIN | Ringkasan jumlah user/store/produk/order/voucher/promo/delivery/overdue |
| GET | `/admin/users` | ADMIN | Monitoring user + roles |
| GET | `/admin/stores` | ADMIN | Monitoring toko |
| GET | `/admin/products` | ADMIN | Monitoring produk |
| GET | `/admin/orders` | ADMIN | Monitoring seluruh order |
| GET | `/admin/deliveries` | ADMIN | Monitoring delivery job |
| GET | `/admin/overdue` | ADMIN | Order melewati SLA + riwayat `DIKEMBALIKAN` |
| POST | `/admin/overdue/run` | ADMIN | Trigger manual pengecekan overdue |
| POST | `/admin/simulate-next-day` | ADMIN | Majukan waktu +24 jam & jalankan overdue check |

---

## End-to-End Testing Guide

Alur demo lengkap menggunakan demo accounts:

1. **Buyer** (`buyer1`): top-up wallet → cek alamat default → tambah produk dari `Toko Demo Seapedia` ke cart.
2. `POST /buyer/checkout/preview` dengan `discountCode: "SEAVOUCHER10"` → cek `discount`, `ppn`, `total`.
3. `POST /buyer/checkout` → order baru, status `SEDANG_DIKEMAS`.
4. **Seller** (`seller1`): `GET /seller/orders` → `PATCH /seller/orders/:id/process` → status `MENUNGGU_PENGIRIM`, delivery job dibuat.
5. **Driver** (`driver1`): `GET /driver/jobs` → `POST /driver/jobs/:id/take` (order → `SEDANG_DIKIRIM`) → `POST /driver/jobs/:id/complete` (order → `PESANAN_SELESAI`).
6. **Buyer**: `GET /buyer/orders/:id` → cek `statusHistory` lengkap; `GET /buyer/reports/summary`.
7. **Seller**: `GET /seller/reports/summary` → `totalIncome` bertambah.
8. **Driver**: `GET /driver/earnings` → `totalEarnings` bertambah sebesar `deliveryFee`.
9. **Overdue demo**: buat order baru dengan `deliveryMethod: "INSTANT"`, **jangan** diproses seller. Login **Admin** → `POST /admin/simulate-next-day` → `GET /admin/overdue` → order menjadi `DIKEMBALIKAN`, wallet buyer ter-refund, stok produk kembali.
10. **Multi-role demo**: login `multirole1` → `requiresRoleSelection: true` → `POST /auth/select-role` dengan `role: "SELLER"` atau `"BUYER"`.

---

## Security Testing Checklist

| # | Skenario | Hasil yang Diharapkan |
|---|---|---|
| 1 | `POST /reviews` dengan `comment: "<script>alert(1)</script>Mantap"` | Tag `<script>` tidak tersimpan/dieksekusi sebagai HTML aktif |
| 2 | `POST /seller/products` dengan `name` mengandung `<img onerror=...>` | Tag dihapus dari hasil yang disimpan |
| 3 | `POST /auth/login` dengan `username: "admin' OR '1'='1"` | `401 Invalid username or password` (bukan SQL error/bypass) |
| 4 | `POST /auth/logout` lalu pakai token yang sama untuk `GET /auth/me` | `401 Token has been revoked` |
| 5 | Token `activeRole: BUYER` mengakses `POST /seller/products` | `403 Forbidden` |
| 6 | Token Buyer A mengakses `GET /buyer/orders/:id` milik Buyer B | `404 Order not found` |
| 7 | Token Seller A mengakses `PUT /seller/products/:id` milik Seller B | `403 Forbidden` |
| 8 | Token non-admin mengakses `GET /admin/users` | `403 Forbidden` |
| 9 | `POST /auth/login` gagal berulang >20x dalam 15 menit | `429 Too Many Requests` |
| 10 | `POST /admin/vouchers` dengan `type: "PERCENTAGE", value: 150` | `400` (melebihi 100%) |
| 11 | `POST /buyer/addresses` dengan `phoneNumber: "abc"` | `400` dengan `errors.phoneNumber` |
