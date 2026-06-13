const prisma = require('../../config/db');
const { formatProduct } = require('../../utils/serialize');
const { formatOrder } = require('../order/order.service');
const { DELIVERY_SLA_HOURS } = require('../../config/constants');
const { getCurrentTime, advanceTime } = require('../../utils/clock');
const { runOverdueCheck, getSlaDeadline } = require('../overdue/overdue.service');

const getUsersMonitoring = async () => {
    const users = await prisma.user.findMany({
        include: { roles: true },
        orderBy: { createdAt: 'desc' },
    });

    return users.map((u) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        name: u.name,
        roles: u.roles.map((r) => r.role),
        createdAt: u.createdAt,
    }));
};

const getStoresMonitoring = async () => {
    const stores = await prisma.store.findMany({
        include: {
            seller: { select: { id: true, username: true, name: true } },
            products: { select: { id: true } },
        },
        orderBy: { createdAt: 'desc' },
    });

    return stores.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        seller: s.seller,
        totalProducts: s.products.length,
        createdAt: s.createdAt,
    }));
};

const getProductsMonitoring = async () => {
    const products = await prisma.product.findMany({
        include: { store: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
    });

    return products.map(formatProduct);
};

const getOrdersMonitoring = async () => {
    const orders = await prisma.order.findMany({
        include: {
            items: true,
            statusHistory: { orderBy: { createdAt: 'asc' } },
            buyer: { select: { id: true, username: true, name: true } },
            store: { select: { id: true, name: true } },
            delivery: { include: { driver: { select: { id: true, username: true, name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
    });

    return orders.map(formatOrder);
};

const getDeliveriesMonitoring = async () => {
    const deliveries = await prisma.delivery.findMany({
        include: {
            order: { select: { id: true, status: true, deliveryMethod: true, total: true } },
            driver: { select: { id: true, username: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
    });

    return deliveries.map((d) => ({
        ...d,
        earning: Number(d.earning),
        order: { ...d.order, total: Number(d.order.total) },
    }));
};

// Order yang sudah melewati SLA tapi belum diproses, + riwayat order yang sudah dikembalikan
const getOverdueMonitoring = async () => {
    const now = await getCurrentTime();

    const candidates = await prisma.order.findMany({
        where: { status: { notIn: ['PESANAN_SELESAI', 'DIKEMBALIKAN'] } },
        include: {
            buyer: { select: { id: true, username: true } },
            store: { select: { id: true, name: true } },
        },
    });

    const overdueCandidates = candidates
        .filter((o) => now > getSlaDeadline(o))
        .map((o) => ({
            id: o.id,
            status: o.status,
            deliveryMethod: o.deliveryMethod,
            total: Number(o.total),
            createdAt: o.createdAt,
            slaDeadline: getSlaDeadline(o),
            buyer: o.buyer,
            store: o.store,
        }));

    const returnedOrders = await prisma.order.findMany({
        where: { status: 'DIKEMBALIKAN' },
        include: {
            buyer: { select: { id: true, username: true } },
            store: { select: { id: true, name: true } },
            statusHistory: { where: { status: 'DIKEMBALIKAN' }, orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: { updatedAt: 'desc' },
    });

    return {
        currentSimulatedTime: now,
        slaRules: DELIVERY_SLA_HOURS,
        overdueCandidates,
        returnedOrders: returnedOrders.map((o) => ({
            id: o.id,
            total: Number(o.total),
            buyer: o.buyer,
            store: o.store,
            returnedAt: o.statusHistory[0] ? o.statusHistory[0].createdAt : o.updatedAt,
        })),
    };
};

const getSummary = async () => {
    const [totalUsers, totalStores, totalProducts, totalOrders, totalVouchers, totalPromos, totalDeliveries] =
        await Promise.all([
            prisma.user.count(),
            prisma.store.count(),
            prisma.product.count(),
            prisma.order.count(),
            prisma.voucher.count(),
            prisma.promo.count(),
            prisma.delivery.count(),
        ]);

    const overdue = await getOverdueMonitoring();

    return {
        totalUsers,
        totalStores,
        totalProducts,
        totalOrders,
        totalVouchers,
        totalPromos,
        totalDeliveries,
        currentSimulatedTime: overdue.currentSimulatedTime,
        overdueCount: overdue.overdueCandidates.length,
        returnedOrdersCount: overdue.returnedOrders.length,
    };
};

// Memajukan waktu simulasi 24 jam, lalu langsung menjalankan overdue check
const simulateNextDay = async () => {
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const newTime = await advanceTime(ONE_DAY_MS);
    const result = await runOverdueCheck();

    return { simulatedTime: newTime, overdueCheck: result };
};

module.exports = {
    getUsersMonitoring,
    getStoresMonitoring,
    getProductsMonitoring,
    getOrdersMonitoring,
    getDeliveriesMonitoring,
    getOverdueMonitoring,
    getSummary,
    simulateNextDay,
};