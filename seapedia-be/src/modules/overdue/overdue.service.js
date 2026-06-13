const prisma = require('../../config/db');
const { DELIVERY_SLA_HOURS } = require('../../config/constants');
const { getCurrentTime } = require('../../utils/clock');

const HOUR_MS = 60 * 60 * 1000;

const getSlaDeadline = (order) => {
    const slaHours = DELIVERY_SLA_HOURS[order.deliveryMethod];
    return new Date(order.createdAt.getTime() + slaHours * HOUR_MS);
};

// Order yang belum selesai/dikembalikan dan sudah melewati SLA-nya
const findOverdueOrders = async (now) => {
    const candidates = await prisma.order.findMany({
        where: { status: { notIn: ['PESANAN_SELESAI', 'DIKEMBALIKAN'] } },
        include: { items: true, delivery: true },
    });

    return candidates.filter((order) => now > getSlaDeadline(order));
};

// Memproses 1 order overdue: refund wallet, restore stock, batalkan delivery, ubah status
const processOverdueOrder = async (orderId, now) => {
    return prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
            where: { id: orderId },
            include: { items: true, delivery: true },
        });

        if (!order) return null;

        // Idempotency guard: jangan proses ulang order yang sudah selesai/dikembalikan
        if (order.status === 'PESANAN_SELESAI' || order.status === 'DIKEMBALIKAN') {
            return null;
        }

        // 1. Ubah status order menjadi final: Dikembalikan
        await tx.order.update({
            where: { id: orderId },
            data: { status: 'DIKEMBALIKAN' },
        });

        await tx.orderStatusHistory.create({
            data: {
                orderId,
                status: 'DIKEMBALIKAN',
                note: `Auto-returned: exceeded SLA (${DELIVERY_SLA_HOURS[order.deliveryMethod]}h) for ${order.deliveryMethod} delivery`,
                createdAt: now,
            },
        });

        // 2. Refund total order ke wallet buyer + catat di wallet transaction history
        const updatedWallet = await tx.wallet.update({
            where: { userId: order.buyerId },
            data: { balance: { increment: order.total } },
        });

        await tx.walletTransaction.create({
            data: {
                walletId: updatedWallet.id,
                type: 'REFUND',
                amount: order.total,
                balanceAfter: updatedWallet.balance,
                description: `Refund for overdue order ${order.id}`,
                orderId: order.id,
                createdAt: now,
            },
        });

        // 3. Kembalikan stok produk sesuai quantity tiap item
        for (const item of order.items) {
            await tx.product.update({
                where: { id: item.productId },
                data: { stock: { increment: item.quantity } },
            });
        }

        // 4. Batalkan delivery job jika ada dan belum selesai
        if (order.delivery && order.delivery.status !== 'COMPLETED') {
            await tx.delivery.update({
                where: { id: order.delivery.id },
                data: { status: 'CANCELLED' },
            });
        }

        return tx.order.findUnique({ where: { id: orderId } });
    });
};

const runOverdueCheck = async () => {
    const now = await getCurrentTime();
    const overdueOrders = await findOverdueOrders(now);

    const processedIds = [];

    for (const order of overdueOrders) {
        const result = await processOverdueOrder(order.id, now);
        if (result) processedIds.push(result.id);
    }

    return {
        checkedAt: now,
        totalCandidates: overdueOrders.length,
        totalProcessed: processedIds.length,
        processedOrderIds: processedIds,
    };
};

module.exports = { runOverdueCheck, findOverdueOrders, getSlaDeadline };