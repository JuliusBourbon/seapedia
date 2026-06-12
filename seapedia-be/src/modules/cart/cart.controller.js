const cartService = require('./cart.service');
const { success } = require('../../utils/responseFormatter');

const getCart = async (req, res, next) => {
    try {
        const cart = await cartService.getFullCart(req.user.userId);
        return success(res, 200, 'Cart retrieved successfully', cart);
    } catch (err) {
        return next(err);
    }
};

const addItem = async (req, res, next) => {
    try {
        const cart = await cartService.addItem(req.user.userId, req.body);
        return success(res, 201, 'Item added to cart', cart);
    } catch (err) {
        return next(err);
    }
};

const updateItem = async (req, res, next) => {
    try {
        const cart = await cartService.updateItemQuantity(req.user.userId, req.params.productId, req.body.quantity);
        return success(res, 200, 'Cart item updated', cart);
    } catch (err) {
        return next(err);
    }
};

const removeItem = async (req, res, next) => {
    try {
        const cart = await cartService.removeItem(req.user.userId, req.params.productId);
        return success(res, 200, 'Item removed from cart', cart);
    } catch (err) {
        return next(err);
    }
};

const clearCart = async (req, res, next) => {
    try {
        const cart = await cartService.clearCart(req.user.userId);
        return success(res, 200, 'Cart cleared', cart);
    } catch (err) {
        return next(err);
    }
};

module.exports = { getCart, addItem, updateItem, removeItem, clearCart };