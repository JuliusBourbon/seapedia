const express = require('express');
const router = express.Router();

const controller = require('./address.controller');
const validate = require('../../middlewares/validate.middleware');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireActiveRole } = require('../../middlewares/role.middleware');
const { addressSchema, updateAddressSchema } = require('./address.validation');

router.get('/', authenticate, requireActiveRole('BUYER'), controller.getAddresses);
router.post('/', authenticate, requireActiveRole('BUYER'), validate(addressSchema), controller.createAddress);
router.put('/:id', authenticate, requireActiveRole('BUYER'), validate(updateAddressSchema), controller.updateAddress);
router.delete('/:id', authenticate, requireActiveRole('BUYER'), controller.deleteAddress);

module.exports = router;