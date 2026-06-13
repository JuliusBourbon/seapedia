const express = require('express');
const router = express.Router();

const controller = require('./report.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireActiveRole } = require('../../middlewares/role.middleware');

router.get('/summary', authenticate, requireActiveRole('BUYER'), controller.getBuyerReport);

module.exports = router;