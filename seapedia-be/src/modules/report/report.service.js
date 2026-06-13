const prisma = require('../../config/db');

const getBuyerReport = async (buyerId) => {
    const orders = await prisma.order.findMany({ where: { buyerId } });

    const totalSpending = orders.reduce((acc, o) => acc + Number(o.total), 0);
    const totalDiscount = orders.reduce((acc, o) => acc + Number(o.discountAmount), 0);
    const totalPpn = orders.reduce((acc, o) => acc + Number(o.ppn), 0);
    const totalDeliveryFee = orders.reduce((acc, o) => acc + Number(o.deliveryFee), 0);

    const returnedOrders = orders.filter((o) => o.status === 'DIKEMBALIKAN');
    const totalRefunded = returnedOrders.reduce((acc, o) => acc + Number(o.total), 0);

    const statusBreakdown = orders.reduce((acc, o) => {
        acc[o.status] = (acc[o.status] || 0) + 1;
        return acc;
    }, {});

    return {
        totalOrders: orders.length,
        totalSpending,
        totalDiscount,
        totalPpn,
        totalDeliveryFee,
        totalRefunded,
        refundedOrdersCount: returnedOrders.length,
        statusBreakdown,
    };
};

const getSellerReport = async (sellerId) => {
    const store = await prisma.store.findUnique({ where: { sellerId } });
    if (!store) {
        throw { statusCode: 404, message: 'You do not have a store yet' };
    }

    const orders = await prisma.order.findMany({ where: { storeId: store.id } });

    const validOrders = orders.filter((o) => o.status !== 'DIKEMBALIKAN');
    const returnedOrders = orders.filter((o) => o.status === 'DIKEMBALIKAN');

    // Income = subtotal - discount, hanya dari order yang TIDAK dikembalikan
    const totalIncome = validOrders.reduce((acc, o) => acc + (Number(o.subtotal) - Number(o.discountAmount)), 0);

    // Untuk transparansi: berapa income yang "dibatalkan" karena order overdue/dikembalikan
    const totalReversedIncome = returnedOrders.reduce(
        (acc, o) => acc + (Number(o.subtotal) - Number(o.discountAmount)),
        0
    );

    const statusBreakdown = orders.reduce((acc, o) => {
        acc[o.status] = (acc[o.status] || 0) + 1;
        return acc;
    }, {});

    return {
        storeName: store.name,
        totalOrders: orders.length,
        totalIncome,
        totalReversedIncome,
        returnedOrdersCount: returnedOrders.length,
        statusBreakdown,
    };
};

module.exports = { getBuyerReport, getSellerReport };