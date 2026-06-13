const express = require('express');
const router = express.Router();

const controller = require('./discount.controller');
const validate = require('../../middlewares/validate.middleware');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireActiveRole } = require('../../middlewares/role.middleware');
const { createVoucherSchema, createPromoSchema } = require('./discount.validation');

router.post('/vouchers', authenticate, requireActiveRole('ADMIN'), validate(createVoucherSchema), controller.createVoucher);
router.post('/promos', authenticate, requireActiveRole('ADMIN'), validate(createPromoSchema), controller.createPromo);

router.patch('/vouchers/:code/toggle', authenticate, requireActiveRole('ADMIN'), controller.toggleVoucherStatus);
router.patch('/promos/:code/toggle', authenticate, requireActiveRole('ADMIN'), controller.togglePromoStatus);

module.exports = router;