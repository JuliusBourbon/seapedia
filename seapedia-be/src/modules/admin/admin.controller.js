const adminService = require('./admin.service');
const { runOverdueCheck } = require('../overdue/overdue.service');
const { success } = require('../../utils/responseFormatter');

const getSummary = async (req, res, next) => {
    try {
        const summary = await adminService.getSummary();
        return success(res, 200, 'Admin summary retrieved successfully', summary);
    } catch (err) {
        return next(err);
    }
};

const getUsers = async (req, res, next) => {
    try {
        const users = await adminService.getUsersMonitoring();
        return success(res, 200, 'Users retrieved successfully', users);
    } catch (err) {
        return next(err);
    }
};

const getStores = async (req, res, next) => {
    try {
        const stores = await adminService.getStoresMonitoring();
        return success(res, 200, 'Stores retrieved successfully', stores);
    } catch (err) {
        return next(err);
    }
};

const getProducts = async (req, res, next) => {
    try {
        const products = await adminService.getProductsMonitoring();
        return success(res, 200, 'Products retrieved successfully', products);
    } catch (err) {
        return next(err);
    }
};

const getOrders = async (req, res, next) => {
    try {
        const orders = await adminService.getOrdersMonitoring();
        return success(res, 200, 'Orders retrieved successfully', orders);
    } catch (err) {
        return next(err);
    }
};

const getDeliveries = async (req, res, next) => {
    try {
        const deliveries = await adminService.getDeliveriesMonitoring();
        return success(res, 200, 'Deliveries retrieved successfully', deliveries);
    } catch (err) {
        return next(err);
    }
};

const getOverdue = async (req, res, next) => {
    try {
        const overdue = await adminService.getOverdueMonitoring();
        return success(res, 200, 'Overdue monitoring retrieved successfully', overdue);
    } catch (err) {
        return next(err);
    }
};

const runOverdue = async (req, res, next) => {
    try {
        const result = await runOverdueCheck();
        return success(res, 200, 'Overdue check executed', result);
    } catch (err) {
        return next(err);
    }
};

const simulateNextDay = async (req, res, next) => {
    try {
        const result = await adminService.simulateNextDay();
        return success(res, 200, 'Simulated next day successfully', result);
    } catch (err) {
        return next(err);
    }
};

module.exports = {
    getSummary,
    getUsers,
    getStores,
    getProducts,
    getOrders,
    getDeliveries,
    getOverdue,
    runOverdue,
    simulateNextDay,
};