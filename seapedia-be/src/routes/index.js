const express = require('express');
const router = express.Router();

const authRoutes = require('../modules/auth/auth.routes');
const reviewRoutes = require('../modules/review/review.routes');
const dashboardRoutes = require('../modules/dashboard/dashboard.routes');

const sellerStoreRoutes = require('../modules/store/store.routes');
const sellerProductRoutes = require('../modules/product/product.routes');

const publicStoreRoutes = require('../modules/store/store.public.routes');
const publicProductRoutes = require('../modules/product/product.public.routes');

// Public-facing endpoints
router.use('/auth', authRoutes);
router.use('/reviews', reviewRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/products', publicProductRoutes);   // GET /products, GET /products/:id
router.use('/stores', publicStoreRoutes);       // GET /stores/:id

// Seller-only endpoints
router.use('/seller/store', sellerStoreRoutes);     // GET/POST/PUT /seller/store
router.use('/seller/products', sellerProductRoutes); // GET/POST /seller/products, PUT/DELETE /seller/products/:id

module.exports = router;