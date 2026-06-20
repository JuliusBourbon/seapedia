const prisma = require('../../config/db');
const { DELIVERY_FEES, PPN_RATE } = require('../../config/constants');
const { validateDiscountCode } = require('../discount/discount.service');

const formatOrder = (order) => ({
    ...order,
    subtotal: Number(order.subtotal),
    deliveryFee: Number(order.deliveryFee),
    ppn: Number(order.ppn),
    discountAmount: Number(order.discountAmount),
    total: Number(order.total),
    items: order.items
        ? order.items.map((item) => ({
            ...item,
            price: Number(item.price),
            subtotal: Number(item.subtotal),
        }))
        : undefined,
    delivery: order.delivery
        ? {
            status: order.delivery.status,
            driver: order.delivery.driver || null,
            takenAt: order.delivery.takenAt,
            completedAt: order.delivery.completedAt,
        }
        : null,
});

const getActiveCart = async (buyerId) => {
    const cart = await prisma.cart.findUnique({
        where: { buyerId },
        include: { items: { include: { product: true } } },
    });

    if (!cart || cart.items.length === 0) {
        throw { statusCode: 400, message: 'Your cart is empty' };
    }

    if (!cart.storeId) {
        throw { statusCode: 400, message: 'Cart has no associated store' };
    }

    return cart;
};

// Urutan kalkulasi: subtotal -> discount -> discountedSubtotal -> ppn (dari discountedSubtotal) -> total
const calculateSummary = async (cart, deliveryMethod, discountCode) => {
    const subtotal = cart.items.reduce((acc, item) => acc + Number(item.product.price) * item.quantity, 0);
    const deliveryFee = DELIVERY_FEES[deliveryMethod];

    let discount = { amount: 0, source: null, code: null, type: null, value: null };

    if (discountCode) {
        const result = await validateDiscountCode(discountCode, subtotal);
        discount = {
            amount: result.amount,
            source: result.source,
            code: result.code,
            type: result.type,
            value: result.value,
        };
    }

    const discountedSubtotal = subtotal - discount.amount;
    const ppn = Math.round(discountedSubtotal * PPN_RATE);
    const total = discountedSubtotal + deliveryFee + ppn;

    return { subtotal, discount, deliveryFee, ppn, discountedSubtotal, total };
};

const previewCheckout = async (buyerId, { deliveryMethod, discountCode }) => {
    const cart = await getActiveCart(buyerId);
    return calculateSummary(cart, deliveryMethod, discountCode);
};

const checkout = async (buyerId, { addressId, deliveryMethod, discountCode }) => {
    const cart = await getActiveCart(buyerId);

    const address = await prisma.address.findUnique({ where: { id: addressId } });
    if (!address || address.userId !== buyerId) {
        throw { statusCode: 404, message: 'Address not found' };
    }

    for (const item of cart.items) {
        if (item.quantity > item.product.stock) {
            throw {
                statusCode: 400,
                message: `Insufficient stock for product "${item.product.name}". Available: ${item.product.stock}`,
            };
        }
    }

    const summary = await calculateSummary(cart, deliveryMethod, discountCode);

    const wallet = await prisma.wallet.findUnique({ where: { userId: buyerId } });
    const walletBalance = wallet ? Number(wallet.balance) : 0;

    if (walletBalance < summary.total) {
        throw { statusCode: 400, message: 'Insufficient wallet balance for this checkout' };
    }

    const order = await prisma.$transaction(async (tx) => {
        for (const item of cart.items) {
            const result = await tx.product.updateMany({
                where: { id: item.productId, stock: { gte: item.quantity } },
                data: { stock: { decrement: item.quantity } },
            });

            if (result.count === 0) {
                throw { statusCode: 400, message: `Insufficient stock for product "${item.product.name}"` };
            }
        }

        const newOrder = await tx.order.create({
            data: {
                buyerId,
                storeId: cart.storeId,
                addressId,
                deliveryMethod,
                subtotal: summary.subtotal,
                deliveryFee: summary.deliveryFee,
                ppn: summary.ppn,
                discountAmount: summary.discount.amount,
                discountCode: summary.discount.code,
                discountSource: summary.discount.source,
                total: summary.total,
                status: 'SEDANG_DIKEMAS',
                items: {
                    create: cart.items.map((item) => ({
                        productId: item.productId,
                        productName: item.product.name,
                        price: item.product.price,
                        quantity: item.quantity,
                        subtotal: Number(item.product.price) * item.quantity,
                    })),
                },
                statusHistory: {
                    create: [{ status: 'SEDANG_DIKEMAS', note: 'Order created after successful checkout' }],
                },
            },
            include: { items: true, statusHistory: true },
        });

        const updatedWallet = await tx.wallet.update({
            where: { userId: buyerId },
            data: { balance: { decrement: summary.total } },
        });

        await tx.walletTransaction.create({
            data: {
                walletId: updatedWallet.id,
                type: 'PAYMENT',
                amount: summary.total,
                balanceAfter: updatedWallet.balance,
                description: `Payment for order ${newOrder.id}`,
                orderId: newOrder.id,
            },
        });

        if (summary.discount.source === 'VOUCHER') {
            await tx.voucher.update({
                where: { code: summary.discount.code },
                data: { usedCount: { increment: 1 } },
            });
        }

        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
        await tx.cart.update({ where: { id: cart.id }, data: { storeId: null } });

        return newOrder;
    });

    return formatOrder(order);
};

const getBuyerOrders = async (buyerId) => {
    const orders = await prisma.order.findMany({
        where: { buyerId },
        include: {
            store: { select: { id: true, name: true } },
            delivery: { include: { driver: { select: { id: true, name: true, username: true } } } },
        },
        orderBy: { createdAt: 'desc' },
    });

    return orders.map(formatOrder);
};

const getBuyerOrderById = async (buyerId, orderId) => {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            items: true,
            statusHistory: { orderBy: { createdAt: 'asc' } },
            store: { select: { id: true, name: true } },
            address: true,
            delivery: { include: { driver: { select: { id: true, name: true, username: true } } } },
        },
    });

    if (!order || order.buyerId !== buyerId) {
        throw { statusCode: 404, message: 'Order not found' };
    }

    return formatOrder(order);
};

const getSellerOrders = async (sellerId) => {
    const store = await prisma.store.findUnique({ where: { sellerId } });
    if (!store) {
        throw { statusCode: 404, message: 'You do not have a store yet' };
    }

    const orders = await prisma.order.findMany({
        where: { storeId: store.id },
        include: {
            items: true,
            statusHistory: { orderBy: { createdAt: 'asc' } },
            buyer: { select: { id: true, name: true, username: true } },
            address: true,
            delivery: { include: { driver: { select: { id: true, name: true, username: true } } } },
        },
        orderBy: { createdAt: 'desc' },
    });

    return orders.map(formatOrder);
};

// Seller memproses order: Sedang Dikemas -> Menunggu Pengirim, sekaligus membuat job delivery
const processOrder = async (sellerId, orderId) => {
    const store = await prisma.store.findUnique({ where: { sellerId } });
    if (!store) {
        throw { statusCode: 404, message: 'You do not have a store yet' };
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.storeId !== store.id) {
        throw { statusCode: 404, message: 'Order not found' };
    }

    if (order.status !== 'SEDANG_DIKEMAS') {
        throw {
            statusCode: 400,
            message: `Order cannot be processed because its current status is "${order.status}", expected "SEDANG_DIKEMAS"`,
        };
    }

    const updated = await prisma.$transaction(async (tx) => {
        const o = await tx.order.update({
            where: { id: orderId },
            data: { status: 'MENUNGGU_PENGIRIM' },
        });

        await tx.orderStatusHistory.create({
            data: {
                orderId,
                status: 'MENUNGGU_PENGIRIM',
                note: 'Order processed by seller and is now ready for driver pickup',
            },
        });

        // Buat delivery job yang akan muncul di daftar "available jobs" untuk Driver
        await tx.delivery.create({
            data: {
                orderId,
                status: 'AVAILABLE',
                earning: o.deliveryFee,
            },
        });

        return o;
    });

    return formatOrder({ ...updated, items: undefined, delivery: null });
};

module.exports = {
    formatOrder,
    previewCheckout,
    checkout,
    getBuyerOrders,
    getBuyerOrderById,
    getSellerOrders,
    processOrder,
};