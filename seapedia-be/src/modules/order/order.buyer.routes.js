const express = require('express');
const router = express.Router();

const controller = require('./order.controller');
const validate = require('../../middlewares/validate.middleware');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireActiveRole } = require('../../middlewares/role.middleware');
const { checkoutSchema } = require('./order.validation');

router.post('/checkout', authenticate, requireActiveRole('BUYER'), validate(checkoutSchema), controller.checkout);
router.get('/orders', authenticate, requireActiveRole('BUYER'), controller.getBuyerOrders);
router.get('/orders/:id', authenticate, requireActiveRole('BUYER'), controller.getBuyerOrderById);

module.exports = router;