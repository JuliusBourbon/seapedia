const express = require('express');
const router = express.Router();

const controller = require('./order.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireActiveRole } = require('../../middlewares/role.middleware');

router.get('/orders', authenticate, requireActiveRole('SELLER'), controller.getSellerOrders);
router.patch('/orders/:id/process', authenticate, requireActiveRole('SELLER'), controller.processOrder);

module.exports = router;