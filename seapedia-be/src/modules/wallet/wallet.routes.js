const express = require('express');
const router = express.Router();

const controller = require('./wallet.controller');
const validate = require('../../middlewares/validate.middleware');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireActiveRole } = require('../../middlewares/role.middleware');
const { topupSchema } = require('./wallet.validation');

router.get('/', authenticate, requireActiveRole('BUYER'), controller.getWallet);
router.post('/topup', authenticate, requireActiveRole('BUYER'), validate(topupSchema), controller.topup);
router.get('/transactions', authenticate, requireActiveRole('BUYER'), controller.getTransactions);

module.exports = router;