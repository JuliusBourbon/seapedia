const prisma = require('../../config/db');

const formatDelivery = (delivery) => ({
    ...delivery,
    earning: Number(delivery.earning),
});

const formatJob = (delivery) => ({
    id: delivery.id,
    orderId: delivery.orderId,
    status: delivery.status,
    earning: Number(delivery.earning),
    takenAt: delivery.takenAt,
    completedAt: delivery.completedAt,
    order: {
        id: delivery.order.id,
        deliveryMethod: delivery.order.deliveryMethod,
        total: Number(delivery.order.total),
        status: delivery.order.status,
        store: delivery.order.store,
        address: delivery.order.address,
        items: delivery.order.items
            ? delivery.order.items.map((item) => ({ ...item, price: Number(item.price), subtotal: Number(item.subtotal) }))
            : undefined,
    },
});

// Hanya job yang order-nya sudah "Menunggu Pengirim" dan belum diambil driver lain
const getAvailableJobs = async () => {
    const jobs = await prisma.delivery.findMany({
        where: { status: 'AVAILABLE' },
        include: {
            order: {
                include: {
                    store: { select: { id: true, name: true } },
                    address: true,
                },
            },
        },
        orderBy: { createdAt: 'asc' },
    });

    return jobs.map(formatJob);
};

const getJobById = async (id) => {
    const delivery = await prisma.delivery.findUnique({
        where: { id },
        include: {
            order: {
                include: {
                    store: { select: { id: true, name: true } },
                    address: true,
                    items: true,
                },
            },
        },
    });

    if (!delivery) {
        throw { statusCode: 404, message: 'Job not found' };
    }

    return formatJob(delivery);
};

// Take job: atomik mencegah 2 driver mengambil order yang sama
const takeJob = async (driverId, deliveryId) => {
    const delivery = await prisma.delivery.findUnique({ where: { id: deliveryId } });

    if (!delivery) {
        throw { statusCode: 404, message: 'Job not found' };
    }

    if (delivery.status !== 'AVAILABLE') {
        throw { statusCode: 409, message: 'This job is no longer available' };
    }

    const updated = await prisma.$transaction(async (tx) => {
        // updateMany dengan kondisi status & driverId memastikan hanya 1 driver yang berhasil
        const result = await tx.delivery.updateMany({
            where: { id: deliveryId, status: 'AVAILABLE', driverId: null },
            data: { status: 'TAKEN', driverId, takenAt: new Date() },
        });

        if (result.count === 0) {
            throw { statusCode: 409, message: 'This job has already been taken by another driver' };
        }

        await tx.order.update({
            where: { id: delivery.orderId },
            data: { status: 'SEDANG_DIKIRIM' },
        });

        await tx.orderStatusHistory.create({
            data: {
                orderId: delivery.orderId,
                status: 'SEDANG_DIKIRIM',
                note: 'Driver has taken the delivery job',
            },
        });

        return tx.delivery.findUnique({ where: { id: deliveryId } });
    });

    return formatDelivery(updated);
};

const completeJob = async (driverId, deliveryId) => {
    const delivery = await prisma.delivery.findUnique({ where: { id: deliveryId } });

    if (!delivery) {
        throw { statusCode: 404, message: 'Job not found' };
    }

    if (delivery.driverId !== driverId) {
        throw { statusCode: 403, message: 'This job is not assigned to you' };
    }

    if (delivery.status !== 'TAKEN') {
        throw { statusCode: 400, message: `Job cannot be completed from status "${delivery.status}"` };
    }

    const updated = await prisma.$transaction(async (tx) => {
        const result = await tx.delivery.update({
            where: { id: deliveryId },
            data: { status: 'COMPLETED', completedAt: new Date() },
        });

        await tx.order.update({
            where: { id: delivery.orderId },
            data: { status: 'PESANAN_SELESAI' },
        });

        await tx.orderStatusHistory.create({
            data: {
                orderId: delivery.orderId,
                status: 'PESANAN_SELESAI',
                note: 'Delivery completed and confirmed by driver',
            },
        });

        return result;
    });

    return formatDelivery(updated);
};

const getActiveJob = async (driverId) => {
    const delivery = await prisma.delivery.findFirst({
        where: { driverId, status: 'TAKEN' },
        include: {
            order: {
                include: {
                    store: { select: { id: true, name: true } },
                    address: true,
                    items: true,
                },
            },
        },
    });

    return delivery ? formatJob(delivery) : null;
};

const getJobHistory = async (driverId) => {
    const deliveries = await prisma.delivery.findMany({
        where: { driverId, status: 'COMPLETED' },
        include: {
            order: {
                include: {
                    store: { select: { id: true, name: true } },
                    address: true,
                },
            },
        },
        orderBy: { completedAt: 'desc' },
    });

    return deliveries.map(formatJob);
};

// Aturan earning: driver mendapat sebesar deliveryFee dari order yang diselesaikan
const getEarningsSummary = async (driverId) => {
    const completed = await prisma.delivery.findMany({ where: { driverId, status: 'COMPLETED' } });
    const activeJob = await prisma.delivery.findFirst({ where: { driverId, status: 'TAKEN' } });

    const totalEarnings = completed.reduce((acc, d) => acc + Number(d.earning), 0);

    return {
        totalCompletedJobs: completed.length,
        totalEarnings,
        hasActiveJob: !!activeJob,
    };
};

module.exports = {
    getAvailableJobs,
    getJobById,
    takeJob,
    completeJob,
    getActiveJob,
    getJobHistory,
    getEarningsSummary,
};