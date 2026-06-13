const discountService = require('./discount.service');
const { success } = require('../../utils/responseFormatter');

const createVoucher = async (req, res, next) => {
    try {
        const voucher = await discountService.createVoucher(req.body);
        return success(res, 201, 'Voucher created successfully', voucher);
    } catch (err) {
        return next(err);
    }
};

const listVouchers = async (req, res, next) => {
    try {
        const vouchers = await discountService.listVouchers();
        return success(res, 200, 'Vouchers retrieved successfully', vouchers);
    } catch (err) {
        return next(err);
    }
};

const getVoucherByCode = async (req, res, next) => {
    try {
        const voucher = await discountService.getVoucherByCode(req.params.code);
        return success(res, 200, 'Voucher retrieved successfully', voucher);
    } catch (err) {
        return next(err);
    }
};

const createPromo = async (req, res, next) => {
    try {
        const promo = await discountService.createPromo(req.body);
        return success(res, 201, 'Promo created successfully', promo);
    } catch (err) {
        return next(err);
    }
};

const listPromos = async (req, res, next) => {
    try {
        const promos = await discountService.listPromos();
        return success(res, 200, 'Promos retrieved successfully', promos);
    } catch (err) {
        return next(err);
    }
};

const getPromoByCode = async (req, res, next) => {
    try {
        const promo = await discountService.getPromoByCode(req.params.code);
        return success(res, 200, 'Promo retrieved successfully', promo);
    } catch (err) {
        return next(err);
    }
};

const toggleVoucherStatus = async (req, res, next) => {
    try {
        const voucher = await discountService.toggleVoucherStatus(req.params.code);
        return success(res, 200, 'Voucher status updated', voucher);
    } catch (err) {
        return next(err);
    }
};

const togglePromoStatus = async (req, res, next) => {
    try {
        const promo = await discountService.togglePromoStatus(req.params.code);
        return success(res, 200, 'Promo status updated', promo);
    } catch (err) {
        return next(err);
    }
};

module.exports = {
    createVoucher,
    listVouchers,
    getVoucherByCode,
    createPromo,
    listPromos,
    getPromoByCode,
    toggleVoucherStatus,
    togglePromoStatus,
};