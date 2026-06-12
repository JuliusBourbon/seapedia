const storeService = require('./store.service');
const { success } = require('../../utils/responseFormatter');

const getMyStore = async (req, res, next) => {
    try {
        const store = await storeService.getMyStore(req.user.userId);
        return success(res, 200, store ? 'Store retrieved' : 'No store found for this seller yet', store);
    } catch (err) {
        return next(err);
    }
};

const createStore = async (req, res, next) => {
    try {
        const store = await storeService.createStore(req.user.userId, req.body);
        return success(res, 201, 'Store created successfully', store);
    } catch (err) {
        return next(err);
    }
};

const updateStore = async (req, res, next) => {
    try {
        const store = await storeService.updateStore(req.user.userId, req.body);
        return success(res, 200, 'Store updated successfully', store);
    } catch (err) {
        return next(err);
    }
};

const getStoreById = async (req, res, next) => {
    try {
        const store = await storeService.getStoreById(req.params.id);
        return success(res, 200, 'Store retrieved successfully', store);
    } catch (err) {
        return next(err);
    }
};

module.exports = { getMyStore, createStore, updateStore, getStoreById };