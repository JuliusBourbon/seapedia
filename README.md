# SEAPEDIA

SEAPEDIA is a comprehensive marketplace application designed to facilitate transactions between buyers and multiple sellers, specifically tailored for maritime and seafood products. The system is equipped with robust features including multi-role user management, order processing, delivery tracking, and administrative monitoring.

This project consists of two main components:
- **Backend**: A RESTful API built with Node.js, Express, and Prisma ORM using PostgreSQL.
- **Frontend**: A cross-platform mobile application built with React Native and Expo.

---

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

### Creating an Admin Account

The SEAPEDIA system strictly controls the creation of Admin accounts. They cannot be registered through the public registration endpoints for security reasons. 

An initial Admin account is automatically created when you run the database seed command (`npx prisma db seed`). The default credentials generated are:
- **Username**: `admin`
- **Password**: `admin123`

*Note: It is highly recommended to change the password immediately after the first login in a production environment.*

### Running the Backend Server

Start the development server:
```bash
npm run dev
```
The backend API will be accessible at `http://localhost:3000`.

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
EXPO_PUBLIC_API_URL="http://localhost:3000/api/v1"
```

### Running the Application

Start the Expo development server:
```bash
npx expo start -c
```

You can run the application on:
- **iOS Simulator**: Press `i` in the terminal.
- **Android Emulator**: Press `a` in the terminal.
- **Physical Device**: Scan the generated QR code using the Expo Go app.
- **Web Browser**: Press `w` in the terminal.

---

## 4. Key Features Overview

- **Role-Based Access Control (RBAC)**: Supports `ADMIN`, `BUYER`, `SELLER`, and `DRIVER` roles. Users can possess multiple roles simultaneously and select their active role upon login.
- **Marketplace Ecosystem**: Sellers can manage products and stores; Buyers can browse, add to cart, and checkout with automated PPN (VAT) calculations.
- **Delivery Management**: Drivers can claim available jobs, complete deliveries, and track earnings.
- **Automated SLA and Refunds**: Orders exceeding their Service Level Agreement (SLA) are automatically returned, triggering stock restoration and wallet refunds.
- **Security Protocols**: Built-in protections against SQL Injection (via Prisma ORM) and Cross-Site Scripting (XSS) using strict input sanitization.
