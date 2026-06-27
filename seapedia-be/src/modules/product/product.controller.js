const productService = require('./product.service');
const { success } = require('../../utils/responseFormatter');

const getMyProducts = async (req, res, next) => {
    try {
        const products = await productService.getMyProducts(req.user.userId);
        return success(res, 200, 'Products retrieved successfully', products);
    } catch (err) {
        return next(err);
    }
};

const createProduct = async (req, res, next) => {
    try {
        const product = await productService.createProduct(req.user.userId, req.body, req.file);
        return success(res, 201, 'Product created successfully', product);
    } catch (err) {
        return next(err);
    }
};

const updateProduct = async (req, res, next) => {
    try {
        const product = await productService.updateProduct(req.user.userId, req.params.id, req.body, req.file);
        return success(res, 200, 'Product updated successfully', product);
    } catch (err) {
        return next(err);
    }
};

const deleteProduct = async (req, res, next) => {
    try {
        const result = await productService.deleteProduct(req.user.userId, req.params.id);
        return success(res, 200, 'Product deleted successfully', result);
    } catch (err) {
        return next(err);
    }
};

const getPublicProducts = async (req, res, next) => {
    try {
        const products = await productService.getPublicProducts();
        return success(res, 200, 'Products retrieved successfully', products);
    } catch (err) {
        return next(err);
    }
};

const getPublicProductById = async (req, res, next) => {
    try {
        const product = await productService.getPublicProductById(req.params.id);
        return success(res, 200, 'Product retrieved successfully', product);
    } catch (err) {
        return next(err);
    }
};

module.exports = {
    getMyProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getPublicProducts,
    getPublicProductById,
};