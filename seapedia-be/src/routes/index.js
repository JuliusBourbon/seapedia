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

const discountAdminRoutes = require('../modules/discount/discount.admin.routes');
const discountPublicRoutes = require('../modules/discount/discount.public.routes');

const reportBuyerRoutes = require('../modules/report/report.buyer.routes');
const reportSellerRoutes = require('../modules/report/report.seller.routes');

const deliveryRoutes = require('../modules/delivery/delivery.routes');

const adminRoutes = require('../modules/admin/admin.routes');

// Public-facing endpoints
router.use('/auth', authRoutes);
router.use('/reviews', reviewRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/products', publicProductRoutes);
router.use('/stores', publicStoreRoutes);
router.use('/', discountPublicRoutes);

// Admin-only endpoints
router.use('/admin', discountAdminRoutes);
// monitoring + overdue trigger + simulate next day
router.use('/admin', adminRoutes);

// Seller-only endpoints
router.use('/seller/store', sellerStoreRoutes);
router.use('/seller/products', sellerProductRoutes);
router.use('/seller', orderSellerRoutes);
router.use('/seller/reports', reportSellerRoutes);

// Buyer-only endpoints
router.use('/buyer/wallet', walletRoutes);
router.use('/buyer/addresses', addressRoutes);
router.use('/buyer/cart', cartRoutes);
router.use('/buyer', orderBuyerRoutes);
router.use('/buyer/reports', reportBuyerRoutes);

// Driver-only endpoints
router.use('/driver', deliveryRoutes);

module.exports = router;