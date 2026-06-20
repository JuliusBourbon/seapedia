const express = require('express');
const router = express.Router();

const prisma = require('../../config/db');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireActiveRole } = require('../../middlewares/role.middleware');
const { success } = require('../../utils/responseFormatter');

router.get('/buyer/summary', authenticate, requireActiveRole('BUYER'), async (req, res, next) => {
    try {
        const wallet = await prisma.wallet.findUnique({ where: { userId: req.user.userId } });

        const recentTransactions = wallet
            ? await prisma.walletTransaction.findMany({
                where: { walletId: wallet.id },
                orderBy: { createdAt: 'desc' },
                take: 5,
            })
            : [];

        const activeOrders = await prisma.order.count({
            where: { buyerId: req.user.userId, status: { not: 'PESANAN_SELESAI' } },
        });

        return success(res, 200, 'Buyer dashboard summary', {
            walletBalance: wallet ? Number(wallet.balance) : 0,
            activeOrders,
            recentTransactions: recentTransactions.map((t) => ({
                ...t,
                amount: Number(t.amount),
                balanceAfter: Number(t.balanceAfter),
            })),
        });
    } catch (err) {
        return next(err);
    }
});

router.get('/seller/summary', authenticate, requireActiveRole('SELLER'), async (req, res, next) => {
    try {
        const store = await prisma.store.findUnique({
            where: { sellerId: req.user.userId },
            include: { products: true },
        });

        const pendingOrders = store
            ? await prisma.order.count({ where: { storeId: store.id, status: 'SEDANG_DIKEMAS' } })
            : 0;

        const completedOrders = store
            ? await prisma.order.findMany({ where: { storeId: store.id, status: 'PESANAN_SELESAI' } })
            : [];

        const totalIncome = completedOrders.reduce((acc, order) => acc + Number(order.subtotal), 0);

        return success(res, 200, 'Seller dashboard summary', {
            hasStore: !!store,
            storeId: store ? store.id : null,
            storeName: store ? store.name : null,
            totalProducts: store ? store.products.length : 0,
            pendingOrders,
            totalIncome,
            note: 'Income data calculated from completed orders',
        });
    } catch (err) {
        return next(err);
    }
});

// Diupdate: membaca delivery job aktif, riwayat job selesai, dan total earnings driver
router.get('/driver/summary', authenticate, requireActiveRole('DRIVER'), async (req, res, next) => {
    try {
        const activeJob = await prisma.delivery.findFirst({
            where: { driverId: req.user.userId, status: 'TAKEN' },
        });

        const completedJobs = await prisma.delivery.findMany({
            where: { driverId: req.user.userId, status: 'COMPLETED' },
        });

        const totalEarnings = completedJobs.reduce((acc, d) => acc + Number(d.earning), 0);

        return success(res, 200, 'Driver dashboard summary', {
            hasActiveJob: !!activeJob,
            activeJobId: activeJob ? activeJob.id : null,
            completedJobs: completedJobs.length,
            totalEarnings,
        });
    } catch (err) {
        return next(err);
    }
});

router.get('/admin/summary', authenticate, requireActiveRole('ADMIN'), (req, res) => {
    return success(res, 200, 'Admin dashboard summary', {
        totalUsers: 0,
        totalStores: 0,
        note: 'Monitoring data will be available starting Level 6',
    });
});

module.exports = router;