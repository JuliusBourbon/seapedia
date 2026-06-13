const express = require('express');
const router = express.Router();

const controller = require('./discount.controller');
const validate = require('../../middlewares/validate.middleware');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireActiveRole } = require('../../middlewares/role.middleware');
const { createVoucherSchema, createPromoSchema } = require('./discount.validation');

// Mounted at /admin -> POST /admin/vouchers, POST /admin/promos
router.post('/vouchers', authenticate, requireActiveRole('ADMIN'), validate(createVoucherSchema), controller.createVoucher);
router.post('/promos', authenticate, requireActiveRole('ADMIN'), validate(createPromoSchema), controller.createPromo);

module.exports = router;