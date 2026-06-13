const express = require('express');
const router = express.Router();

const controller = require('./discount.controller');

// Mounted at / -> GET /vouchers, GET /vouchers/:code, GET /promos, GET /promos/:code
router.get('/vouchers', controller.listVouchers);
router.get('/vouchers/:code', controller.getVoucherByCode);
router.get('/promos', controller.listPromos);
router.get('/promos/:code', controller.getPromoByCode);

module.exports = router;