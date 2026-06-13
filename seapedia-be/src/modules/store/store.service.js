const prisma = require('../../config/db');
const { formatStore, formatProduct } = require('../../utils/serialize');
const { sanitizeText } = require('../../utils/sanitize');

const getMyStore = async (sellerId) => {
    const store = await prisma.store.findUnique({
        where: { sellerId },
        include: { products: true },
    });

    return store ? formatStore(store) : null;
};

const createStore = async (sellerId, { name, description }) => {
    const existingForSeller = await prisma.store.findUnique({ where: { sellerId } });
    if (existingForSeller) {
        throw { statusCode: 409, message: 'You already have a store. Use update instead.' };
    }

    const cleanName = sanitizeText(name);

    const nameTaken = await prisma.store.findUnique({ where: { name: cleanName } });
    if (nameTaken) {
        throw { statusCode: 409, message: 'Store name is already taken', errors: { name: ['Store name is already taken'] } };
    }

    const store = await prisma.store.create({
        data: {
            name: cleanName,
            description: description ? sanitizeText(description) : description,
            sellerId,
        },
    });

    return formatStore(store);
};

const updateStore = async (sellerId, { name, description }) => {
    const store = await prisma.store.findUnique({ where: { sellerId } });

    if (!store) {
        throw { statusCode: 404, message: 'Store not found. Create a store first.' };
    }

    const cleanName = name ? sanitizeText(name) : undefined;

    if (cleanName && cleanName !== store.name) {
        const nameTaken = await prisma.store.findUnique({ where: { name: cleanName } });
        if (nameTaken) {
            throw { statusCode: 409, message: 'Store name is already taken', errors: { name: ['Store name is already taken'] } };
        }
    }

    const updated = await prisma.store.update({
        where: { sellerId },
        data: {
            name: cleanName ?? store.name,
            description: description !== undefined ? sanitizeText(description) : store.description,
        },
    });

    return formatStore(updated);
};

const getStoreById = async (id) => {
    const store = await prisma.store.findUnique({
        where: { id },
        include: {
            products: true,
            seller: { select: { id: true, name: true, username: true } },
        },
    });

    if (!store) {
        throw { statusCode: 404, message: 'Store not found' };
    }

    return {
        ...formatStore(store),
        products: store.products.map(formatProduct),
    };
};

module.exports = { getMyStore, createStore, updateStore, getStoreById };