const prisma = require('../../config/db');

const formatCartItem = (item) => ({
    id: item.id,
    productId: item.productId,
    productName: item.product.name,
    price: Number(item.product.price),
    stock: item.product.stock,
    quantity: item.quantity,
    subtotal: Number(item.product.price) * item.quantity,
});

const formatCart = (cart) => {
    if (!cart) {
        return { id: null, storeId: null, store: null, items: [], summary: { totalItems: 0, subtotal: 0 } };
    }

    const items = cart.items.map(formatCartItem);
    const summary = {
        totalItems: items.reduce((acc, i) => acc + i.quantity, 0),
        subtotal: items.reduce((acc, i) => acc + i.subtotal, 0),
    };

    return {
        id: cart.id,
        storeId: cart.storeId,
        store: cart.store,
        items,
        summary,
    };
};

const getOrCreateCart = async (buyerId) => {
    let cart = await prisma.cart.findUnique({ where: { buyerId } });

    if (!cart) {
        cart = await prisma.cart.create({ data: { buyerId } });
    }

    return cart;
};

const getFullCart = async (buyerId) => {
    const cart = await prisma.cart.findUnique({
        where: { buyerId },
        include: {
            items: { include: { product: true } },
            store: { select: { id: true, name: true } },
        },
    });

    return formatCart(cart);
};

const refreshCartStore = async (cartId) => {
    const remaining = await prisma.cartItem.count({ where: { cartId } });

    if (remaining === 0) {
        await prisma.cart.update({ where: { id: cartId }, data: { storeId: null } });
    }
};

const addItem = async (buyerId, { productId, quantity }) => {
    const product = await prisma.product.findUnique({ where: { id: productId } });

    if (!product) {
        throw { statusCode: 404, message: 'Product not found' };
    }

    const cart = await getOrCreateCart(buyerId);

    // SINGLE-STORE CHECKOUT RULE
    if (cart.storeId && cart.storeId !== product.storeId) {
        throw {
            statusCode: 409,
            message: 'Your cart already contains products from another store. Please clear your cart before adding products from a different store.',
        };
    }

    const existingItem = await prisma.cartItem.findUnique({
        where: { cartId_productId: { cartId: cart.id, productId } },
    });

    if (existingItem) {
        await prisma.cartItem.update({
            where: { id: existingItem.id },
            data: { quantity: existingItem.quantity + quantity },
        });
    } else {
        await prisma.cartItem.create({
            data: { cartId: cart.id, productId, quantity },
        });
    }

    if (!cart.storeId) {
        await prisma.cart.update({ where: { id: cart.id }, data: { storeId: product.storeId } });
    }

    return getFullCart(buyerId);
};

const updateItemQuantity = async (buyerId, productId, quantity) => {
    const cart = await prisma.cart.findUnique({ where: { buyerId } });

    if (!cart) {
        throw { statusCode: 404, message: 'Cart not found' };
    }

    const item = await prisma.cartItem.findUnique({
        where: { cartId_productId: { cartId: cart.id, productId } },
    });

    if (!item) {
        throw { statusCode: 404, message: 'Item not found in cart' };
    }

    if (quantity === 0) {
        await prisma.cartItem.delete({ where: { id: item.id } });
    } else {
        await prisma.cartItem.update({ where: { id: item.id }, data: { quantity } });
    }

    await refreshCartStore(cart.id);
    return getFullCart(buyerId);
};

const removeItem = async (buyerId, productId) => {
    const cart = await prisma.cart.findUnique({ where: { buyerId } });

    if (!cart) {
        throw { statusCode: 404, message: 'Cart not found' };
    }

    await prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId } });
    await refreshCartStore(cart.id);

    return getFullCart(buyerId);
};

const clearCart = async (buyerId) => {
    const cart = await prisma.cart.findUnique({ where: { buyerId } });

    if (cart) {
        await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
        await prisma.cart.update({ where: { id: cart.id }, data: { storeId: null } });
    }

    return getFullCart(buyerId);
};

module.exports = { getFullCart, addItem, updateItemQuantity, removeItem, clearCart };