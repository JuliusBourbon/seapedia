const express = require('express');
const router = express.Router();

const controller = require('./admin.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireActiveRole } = require('../../middlewares/role.middleware');

// Mounted at /admin
router.get('/summary', authenticate, requireActiveRole('ADMIN'), controller.getSummary);
router.get('/users', authenticate, requireActiveRole('ADMIN'), controller.getUsers);
router.get('/stores', authenticate, requireActiveRole('ADMIN'), controller.getStores);
router.get('/products', authenticate, requireActiveRole('ADMIN'), controller.getProducts);
router.get('/orders', authenticate, requireActiveRole('ADMIN'), controller.getOrders);
router.get('/deliveries', authenticate, requireActiveRole('ADMIN'), controller.getDeliveries);
router.get('/overdue', authenticate, requireActiveRole('ADMIN'), controller.getOverdue);

// Overdue handling triggers
router.post('/overdue/run', authenticate, requireActiveRole('ADMIN'), controller.runOverdue);
router.post('/simulate-next-day', authenticate, requireActiveRole('ADMIN'), controller.simulateNextDay);

module.exports = router;