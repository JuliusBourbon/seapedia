const prisma = require('../../config/db');
const { DELIVERY_FEES, PPN_RATE } = require('../../config/constants');

const formatOrder = (order) => ({
    ...order,
    subtotal: Number(order.subtotal),
    deliveryFee: Number(order.deliveryFee),
    ppn: Number(order.ppn),
    total: Number(order.total),
    items: order.items
        ? order.items.map((item) => ({
            ...item,
            price: Number(item.price),
            subtotal: Number(item.subtotal),
        }))
        : undefined,
});

const checkout = async (buyerId, { addressId, deliveryMethod }) => {
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

    const address = await prisma.address.findUnique({ where: { id: addressId } });
    if (!address || address.userId !== buyerId) {
        throw { statusCode: 404, message: 'Address not found' };
    }

    // Validasi awal (sebelum transaksi) supaya error message lebih informatif
    for (const item of cart.items) {
        if (item.quantity > item.product.stock) {
            throw {
                statusCode: 400,
                message: `Insufficient stock for product "${item.product.name}". Available: ${item.product.stock}`,
            };
        }
    }

    // Kalkulasi total
    const subtotal = cart.items.reduce((acc, item) => acc + Number(item.product.price) * item.quantity, 0);
    const deliveryFee = DELIVERY_FEES[deliveryMethod];
    const ppn = Math.round(subtotal * PPN_RATE);
    const total = subtotal + deliveryFee + ppn;

    const wallet = await prisma.wallet.findUnique({ where: { userId: buyerId } });
    const walletBalance = wallet ? Number(wallet.balance) : 0;

    if (walletBalance < total) {
        throw { statusCode: 400, message: 'Insufficient wallet balance for this checkout' };
    }

    const order = await prisma.$transaction(async (tx) => {
        // Kurangi stok dengan kondisi atomik agar tidak pernah negatif
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
                subtotal,
                deliveryFee,
                ppn,
                total,
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
            data: { balance: { decrement: total } },
        });

        await tx.walletTransaction.create({
            data: {
                walletId: updatedWallet.id,
                type: 'PAYMENT',
                amount: total,
                balanceAfter: updatedWallet.balance,
                description: `Payment for order ${newOrder.id}`,
                orderId: newOrder.id,
            },
        });

        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
        await tx.cart.update({ where: { id: cart.id }, data: { storeId: null } });

        return newOrder;
    });

    return formatOrder(order);
};

const getBuyerOrders = async (buyerId) => {
    const orders = await prisma.order.findMany({
        where: { buyerId },
        include: { store: { select: { id: true, name: true } } },
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
        },
        orderBy: { createdAt: 'desc' },
    });

    return orders.map(formatOrder);
};

module.exports = { checkout, getBuyerOrders, getBuyerOrderById, getSellerOrders };