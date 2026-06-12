const express = require('express');
const router = express.Router();

const controller = require('./store.controller');
const validate = require('../../middlewares/validate.middleware');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireActiveRole } = require('../../middlewares/role.middleware');
const { createStoreSchema, updateStoreSchema } = require('./store.validation');

// Semua endpoint di sini hanya untuk Seller, dan hanya untuk toko miliknya sendiri
router.get('/', authenticate, requireActiveRole('SELLER'), controller.getMyStore);
router.post('/', authenticate, requireActiveRole('SELLER'), validate(createStoreSchema), controller.createStore);
router.put('/', authenticate, requireActiveRole('SELLER'), validate(updateStoreSchema), controller.updateStore);

module.exports = router;