const express = require('express');
const router = express.Router();

const prisma = require('../../config/db');
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

// Diupdate: sekarang membaca data toko & jumlah produk yang sesungguhnya
router.get('/seller/summary', authenticate, requireActiveRole('SELLER'), async (req, res, next) => {
    try {
        const store = await prisma.store.findUnique({
            where: { sellerId: req.user.userId },
            include: { products: true },
        });

        return success(res, 200, 'Seller dashboard summary', {
            hasStore: !!store,
            storeId: store ? store.id : null,
            storeName: store ? store.name : null,
            totalProducts: store ? store.products.length : 0,
            totalIncome: 0,
            pendingOrders: 0,
            note: 'Income & order data will be available starting Level 4',
        });
    } catch (err) {
        return next(err);
    }
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