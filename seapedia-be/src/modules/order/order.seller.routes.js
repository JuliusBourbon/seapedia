const express = require('express');
const router = express.Router();

const controller = require('./order.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireActiveRole } = require('../../middlewares/role.middleware');

router.get('/orders', authenticate, requireActiveRole('SELLER'), controller.getSellerOrders);

module.exports = router;