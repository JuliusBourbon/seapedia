const express = require('express');
const router = express.Router();

const authRoutes = require('../modules/auth/auth.routes');
const reviewRoutes = require('../modules/review/review.routes');
const dashboardRoutes = require('../modules/dashboard/dashboard.routes');

const sellerStoreRoutes = require('../modules/store/store.routes');
const sellerProductRoutes = require('../modules/product/product.routes');

const publicStoreRoutes = require('../modules/store/store.public.routes');
const publicProductRoutes = require('../modules/product/product.public.routes');

const walletRoutes = require('../modules/wallet/wallet.routes');
const addressRoutes = require('../modules/address/address.routes');
const cartRoutes = require('../modules/cart/cart.routes');
const orderBuyerRoutes = require('../modules/order/order.buyer.routes');
const orderSellerRoutes = require('../modules/order/order.seller.routes');

// Public-facing endpoints
router.use('/auth', authRoutes);
router.use('/reviews', reviewRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/products', publicProductRoutes);
router.use('/stores', publicStoreRoutes);

// Seller-only endpoints
router.use('/seller/store', sellerStoreRoutes);
router.use('/seller/products', sellerProductRoutes);
router.use('/seller', orderSellerRoutes);

// Buyer-only endpoints
router.use('/buyer/wallet', walletRoutes);
router.use('/buyer/addresses', addressRoutes);
router.use('/buyer/cart', cartRoutes);
router.use('/buyer', orderBuyerRoutes);

module.exports = router;