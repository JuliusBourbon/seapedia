<h1 align="center">SEAPEDIA</h1>

SEAPEDIA is a comprehensive marketplace application designed to facilitate transactions between buyers and multiple sellers. The system is equipped with robust features including multi-role user management, order processing, delivery tracking, and administrative monitoring.

This project consists of two main components:
- **Backend**: A RESTful API built with Node.js, Express, and Prisma ORM using PostgreSQL.
- **Frontend**: A mobile application (Android) built with React Native and Expo.

<p align="center">
  <img src="seapedia-fe/assets/images/icon.png" alt="SEAPEDIA Icon" width="400"/>
</p>

---

<h2 align="center">Running the Application</h2>

**Option 1: Run Locally via Expo**
Follow the local setup instructions in `1. Prerequisites`, `2. Backend Setup`, and `3. Frontend Setup`

**Option 2: Install Released APK**
If you prefer not to run the frontend development server, you can use the released APK:
1. Download the latest release APK file <a href="https://github.com/JuliusBourbon/seapedia/releases/download/v1.0.0/seapedia.apk" target="_blank">seapedia.apk</a>.
2. Install the APK (ensure "Install from Unknown Sources" is enabled in your device settings).
3. Run the SEAPEDIA app directly from your device.

---

<h2 align="center">Demo</h2>

<table align="center">
   <tr>
      <td><img src="seapedia-fe/assets/demo/demo-1.png" alt="SEAPEDIA Icon" width="200"></td>
      <td><img src="seapedia-fe/assets/demo/demo-2.png" alt="SEAPEDIA Icon" width="200"></td>
      <td><img src="seapedia-fe/assets/demo/demo-3.png" alt="SEAPEDIA Icon" width="200"></td>
   </tr>
   <tr>
      <td><img src="seapedia-fe/assets/demo/demo-4.png" alt="SEAPEDIA Icon" width="200"></td>
      <td><img src="seapedia-fe/assets/demo/demo-5.png" alt="SEAPEDIA Icon" width="200"></td>
      <td><img src="seapedia-fe/assets/demo/demo-6.png" alt="SEAPEDIA Icon" width="200"></td>
   </tr>
</table>

---

<h2 align="center">Local setup</h2>

## 1. Prerequisites

Before setting up the project, ensure that you have the following installed on your system:
- **Node.js** (v18 or higher recommended)
- **npm** or **yarn**
- **PostgreSQL** (Running locally or accessible via a remote URL)
- **Expo CLI** (for frontend development)

---

## 2. Backend Setup (`seapedia-be`)

### Installation

1. Navigate to the backend directory:
   ```bash
   cd seapedia-be
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

### Environment Variables

Create a `.env` file in the `seapedia-be` directory and configure the following required environment variables:

```env
# Database Configuration
DATABASE_URL="postgresql://<USER>:<PASSWORD>@<HOST>:<PORT>/<DATABASE_NAME>?schema=public"

# Application Settings
PORT=3000

# Security (Replace with a strong random string in production)
JWT_SECRET="your_super_secret_jwt_key_here"
JWT_EXPIRES_IN="7d"
```

### Database Migration and Seeding

To set up the database schema and populate it with initial data (including the Admin account), execute the following commands:

1. Generate Prisma Client:
   ```bash
   npx prisma generate
   ```

2. Push the schema to the database (or use `migrate dev`):
   ```bash
   npx prisma db push
   ```

3. Seed the database:
   ```bash
   npx prisma db seed
   ```

### Demo Accounts

| Role | Username | Password | Note |
|---|---|---|---|
| Admin | `admin` | `admin123` | Full access to `/admin/*` |
| Seller | `seller1` | `seller123` | Has a store **"Toko Demo Seapedia"** + 3 products |
| Buyer | `buyer1` | `buyer123` | Initial wallet **Rp1.000.000**, has 1 default address |
| Driver | `driver1` | `driver123` | No active jobs yet |
| Multi-role | `multirole1` | `multi123` | Roles **BUYER + SELLER** — use for demo flow of active role selection |

**Discount codes (from seed):**

| Code | Type | Value | Notes |
|---|---|---|---|
| `SEAVOUCHER10` | Voucher, PERCENTAGE | 10% | `usageLimit: 100` |
| `SEAPROMO5K` | Promo, FIXED | Rp5,000 | Unlimited usage |


### Running the Backend Server

Start the development server:
```bash
npm run dev
```
The backend API will be accessible at `http://localhost:3000`.

---

### API Documentation

The API documentation is available in the form of a **Postman Collection** which can be imported directly into Postman.

### Files
- <a href="./seapedia-be/postman/SEAPEDIA API Collection.postman_collection.json" target="_blank">`seapedia-be/postman/SEAPEDIA.postman_collection.json`</a> — all Level 1-7 endpoints complete with test scripts
- <a href="./seapedia-be/postman/SEAPEDIA Local.postman_environment.json" target="_blank">`seapedia-be/postman/SEAPEDIA.postman_environment.json`</a> — environment variables (base URL, tokens per role, etc.)

### How to Import
1. Open **Postman**.
2. Click **Import** → select the two files above.
3. Make sure the **SEAPEDIA** environment is active (top right corner of Postman).
4. Run the backend first (`npm run dev`), then run the seed (`npx prisma db seed`) if you haven't already.
5. Execute requests sequentially starting from the **A. Auth & Role** folder — some requests depend on the results of previous requests via environment variables.

There's also more detail information about Backend/API in <a href="./seapedia-be/README.md" target="_blank"><b>Seapedia-be README.md</b></a>

---

## 3. Frontend Setup (`seapedia-fe`)

### Installation

1. Navigate to the frontend directory from the project root:
   ```bash
   cd seapedia-fe
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

### Environment Variables

Create a `.env` file in the `seapedia-fe` directory and specify the backend API URL. If you are running the app on a physical device, ensure you use your machine's local IP address instead of `localhost`.

```env
EXPO_PUBLIC_API_URL=http://[IP_ADDRESS]:3000/api/v1
```
example:
```env
EXPO_PUBLIC_API_URL=http://192.168.1.2:3000/api/v1
```
Or using deployed Backend:
```env
EXPO_PUBLIC_API_URL=https://chain-customise-improve-fitting.trycloudflare.com/api/v1/api/v1
```

### Run the Frontend Server
```bash
npx expo start
```

---

## Key Features Overview

- **Role-Based Access Control (RBAC)**: Supports `ADMIN`, `BUYER`, `SELLER`, and `DRIVER` roles. Users can possess multiple roles simultaneously and select their active role upon login.
- **Marketplace Ecosystem**: Sellers can manage products and stores; Buyers can browse, add to cart, and checkout with automated PPN (VAT) calculations.
- **Delivery Management**: Drivers can claim available jobs, complete deliveries, and track earnings.
- **Automated SLA and Refunds**: Orders exceeding their Service Level Agreement (SLA) are automatically returned, triggering stock restoration and wallet refunds.
- **Security Protocols**: Built-in protections against SQL Injection (via Prisma ORM) and Cross-Site Scripting (XSS) using strict input sanitization.

## Dependencies

### Backend (`seapedia-be`)

| Package | Version | Type |
| :--- | :--- | :--- |
| `@aws-sdk/client-s3` | `^3.1075.0` | Dependency |
| `@prisma/adapter-pg` | `^7.8.0` | Dependency |
| `@prisma/client` | `^7.8.0` | Dependency |
| `bcrypt` | `^6.0.0` | Dependency |
| `cors` | `^2.8.6` | Dependency |
| `dotenv` | `^17.4.2` | Dependency |
| `express` | `^5.2.1` | Dependency |
| `express-rate-limit` | `^8.5.2` | Dependency |
| `helmet` | `^8.2.0` | Dependency |
| `jsonwebtoken` | `^9.0.3` | Dependency |
| `multer` | `^2.2.0` | Dependency |
| `node-cron` | `^4.2.1` | Dependency |
| `pg` | `^8.21.0` | Dependency |
| `sanitize-html` | `^2.17.5` | Dependency |
| `zod` | `^4.4.3` | Dependency |
| `nodemon` | `^3.1.14` | DevDependency |
| `prisma` | `^7.8.0` | DevDependency |

### Frontend (`seapedia-fe`)

| Package | Version | Type |
| :--- | :--- | :--- |
| `@expo-google-fonts/commissioner` | `^0.4.1` | Dependency |
| `@expo/ui` | `~56.0.18` | Dependency |
| `axios` | `^1.18.0` | Dependency |
| `expo` | `~56.0.12` | Dependency |
| `expo-constants` | `~56.0.18` | Dependency |
| `expo-device` | `~56.0.4` | Dependency |
| `expo-font` | `~56.0.7` | Dependency |
| `expo-glass-effect` | `~56.0.4` | Dependency |
| `expo-image` | `~56.0.11` | Dependency |
| `expo-image-picker` | `~56.0.18` | Dependency |
| `expo-linear-gradient` | `^56.0.4` | Dependency |
| `expo-linking` | `~56.0.14` | Dependency |
| `expo-router` | `~56.2.11` | Dependency |
| `expo-secure-store` | `^56.0.4` | Dependency |
| `expo-splash-screen` | `~56.0.10` | Dependency |
| `expo-status-bar` | `~56.0.4` | Dependency |
| `expo-symbols` | `~56.0.6` | Dependency |
| `expo-system-ui` | `~56.0.5` | Dependency |
| `expo-web-browser` | `~56.0.5` | Dependency |
| `lucide-react-native` | `^1.18.0` | Dependency |
| `nativewind` | `^4.2.5` | Dependency |
| `react` | `19.2.3` | Dependency |
| `react-dom` | `19.2.3` | Dependency |
| `react-native` | `0.85.3` | Dependency |
| `react-native-gesture-handler` | `~2.31.1` | Dependency |
| `react-native-reanimated` | `^4.3.1` | Dependency |
| `react-native-safe-area-context` | `~5.7.0` | Dependency |
| `react-native-screens` | `4.25.2` | Dependency |
| `react-native-svg` | `15.15.4` | Dependency |
| `react-native-web` | `~0.21.0` | Dependency |
| `react-native-worklets` | `0.8.3` | Dependency |
| `tailwindcss` | `^3.4.19` | Dependency |
| `zustand` | `^5.0.14` | Dependency |
| `@types/react` | `~19.2.2` | DevDependency |
| `typescript` | `~6.0.3` | DevDependency |
