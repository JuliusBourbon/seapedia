const prisma = require('../../config/db');
const { formatProduct } = require('../../utils/serialize');
const { sanitizeText } = require('../../utils/sanitize');
const { uploadFileToS3, deleteFileFromS3 } = require('../../utils/s3');

const getStoreBySeller = async (sellerId) => {
    const store = await prisma.store.findUnique({ where: { sellerId } });

    if (!store) {
        throw { statusCode: 404, message: 'You must create a store before managing products' };
    }

    return store;
};

const getMyProducts = async (sellerId) => {
    const store = await getStoreBySeller(sellerId);

    const products = await prisma.product.findMany({
        where: { storeId: store.id },
        orderBy: { createdAt: 'desc' },
    });

    return products.map(formatProduct);
};

const createProduct = async (sellerId, data, file) => {
    const store = await getStoreBySeller(sellerId);

    let imageUrl = null;
    let imageKey = null;

    if (file) {
        const result = await uploadFileToS3(file.buffer, file.mimetype, file.originalname);
        imageUrl = result.imageUrl;
        imageKey = result.imageKey;
    }

    const product = await prisma.product.create({
        data: {
            ...data,
            name: sanitizeText(data.name),
            description: data.description ? sanitizeText(data.description) : data.description,
            storeId: store.id,
            imageUrl,
            imageKey,
        },
    });

    return formatProduct(product);
};

const updateProduct = async (sellerId, productId, data, file) => {
    const store = await getStoreBySeller(sellerId);

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
        throw { statusCode: 404, message: 'Product not found' };
    }

    if (product.storeId !== store.id) {
        throw { statusCode: 403, message: 'You do not have permission to modify this product' };
    }

    let { imageUrl, imageKey } = product;

    if (file) {
        const result = await uploadFileToS3(file.buffer, file.mimetype, file.originalname);
        imageUrl = result.imageUrl;
        
        if (imageKey) {
            await deleteFileFromS3(imageKey);
        }
        
        imageKey = result.imageKey;
    }

    const sanitizedData = { ...data };
    if (sanitizedData.name) sanitizedData.name = sanitizeText(sanitizedData.name);
    if (sanitizedData.description) sanitizedData.description = sanitizeText(sanitizedData.description);

    const updated = await prisma.product.update({
        where: { id: productId },
        data: {
            ...sanitizedData,
            imageUrl,
            imageKey,
        },
    });

    return formatProduct(updated);
};

const deleteProduct = async (sellerId, productId) => {
    const store = await getStoreBySeller(sellerId);

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
        throw { statusCode: 404, message: 'Product not found' };
    }

    if (product.storeId !== store.id) {
        throw { statusCode: 403, message: 'You do not have permission to delete this product' };
    }

    if (product.imageKey) {
        await deleteFileFromS3(product.imageKey);
    }

    await prisma.product.delete({ where: { id: productId } });

    return { id: productId };
};

const getPublicProducts = async () => {
    const products = await prisma.product.findMany({
        include: {
            store: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
    });

    return products.map(formatProduct);
};

const getPublicProductById = async (id) => {
    const product = await prisma.product.findUnique({
        where: { id },
        include: {
            store: { select: { id: true, name: true, description: true } },
        },
    });

    if (!product) {
        throw { statusCode: 404, message: 'Product not found' };
    }

    return formatProduct(product);
};

module.exports = {
    getMyProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getPublicProducts,
    getPublicProductById,
};