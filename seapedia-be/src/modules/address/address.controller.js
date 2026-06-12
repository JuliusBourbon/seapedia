const addressService = require('./address.service');
const { success } = require('../../utils/responseFormatter');

const getAddresses = async (req, res, next) => {
    try {
        const addresses = await addressService.getAddresses(req.user.userId);
        return success(res, 200, 'Addresses retrieved successfully', addresses);
    } catch (err) {
        return next(err);
    }
};

const createAddress = async (req, res, next) => {
    try {
        const address = await addressService.createAddress(req.user.userId, req.body);
        return success(res, 201, 'Address created successfully', address);
    } catch (err) {
        return next(err);
    }
};

const updateAddress = async (req, res, next) => {
    try {
        const address = await addressService.updateAddress(req.user.userId, req.params.id, req.body);
        return success(res, 200, 'Address updated successfully', address);
    } catch (err) {
        return next(err);
    }
};

const deleteAddress = async (req, res, next) => {
    try {
        const result = await addressService.deleteAddress(req.user.userId, req.params.id);
        return success(res, 200, 'Address deleted successfully', result);
    } catch (err) {
        return next(err);
    }
};

module.exports = { getAddresses, createAddress, updateAddress, deleteAddress };