const express = require('express');
const router = express.Router();

const { authenticate } = require('../../middlewares/auth.middleware');
const { requireActiveRole } = require('../../middlewares/role.middleware');
const { success } = require('../../utils/responseFormatter');

router.get('/buyer/summary', authenticate, requireActiveRole('BUYER'), (req, res) => {
    return success(res, 200, 'Buyer dashboard summary', {
        walletBalance: 0,
        activeOrders: 0,
        note: 'Wallet & order data will be available starting Level 3',
    });
});

router.get('/seller/summary', authenticate, requireActiveRole('SELLER'), (req, res) => {
    return success(res, 200, 'Seller dashboard summary', {
        storeName: null,
        totalIncome: 0,
        pendingOrders: 0,
        note: 'Store & income data will be available starting Level 2/4',
    });
});

router.get('/driver/summary', authenticate, requireActiveRole('DRIVER'), (req, res) => {
    return success(res, 200, 'Driver dashboard summary', {
        totalEarnings: 0,
        completedJobs: 0,
        note: 'Delivery job data will be available starting Level 5',
    });
});

router.get('/admin/summary', authenticate, requireActiveRole('ADMIN'), (req, res) => {
    return success(res, 200, 'Admin dashboard summary', {
        totalUsers: 0,
        totalStores: 0,
        note: 'Monitoring data will be available starting Level 6',
    });
});

module.exports = router;