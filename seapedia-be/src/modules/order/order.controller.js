const orderService = require('./order.service');
const { success } = require('../../utils/responseFormatter');

const checkout = async (req, res, next) => {
    try {
        const order = await orderService.checkout(req.user.userId, req.body);
        return success(res, 201, 'Checkout successful', order);
    } catch (err) {
        return next(err);
    }
};

const getBuyerOrders = async (req, res, next) => {
    try {
        const orders = await orderService.getBuyerOrders(req.user.userId);
        return success(res, 200, 'Orders retrieved successfully', orders);
    } catch (err) {
        return next(err);
    }
};

const getBuyerOrderById = async (req, res, next) => {
    try {
        const order = await orderService.getBuyerOrderById(req.user.userId, req.params.id);
        return success(res, 200, 'Order retrieved successfully', order);
    } catch (err) {
        return next(err);
    }
};

const getSellerOrders = async (req, res, next) => {
    try {
        const orders = await orderService.getSellerOrders(req.user.userId);
        return success(res, 200, 'Incoming orders retrieved successfully', orders);
    } catch (err) {
        return next(err);
    }
};

module.exports = { checkout, getBuyerOrders, getBuyerOrderById, getSellerOrders };