const express = require('express');
const router = express.Router();

const controller = require('./cart.controller');
const validate = require('../../middlewares/validate.middleware');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireActiveRole } = require('../../middlewares/role.middleware');
const { addItemSchema, updateQuantitySchema } = require('./cart.validation');

router.get('/', authenticate, requireActiveRole('BUYER'), controller.getCart);
router.post('/items', authenticate, requireActiveRole('BUYER'), validate(addItemSchema), controller.addItem);
router.put('/items/:productId', authenticate, requireActiveRole('BUYER'), validate(updateQuantitySchema), controller.updateItem);
router.delete('/items/:productId', authenticate, requireActiveRole('BUYER'), controller.removeItem);
router.delete('/', authenticate, requireActiveRole('BUYER'), controller.clearCart);

module.exports = router;