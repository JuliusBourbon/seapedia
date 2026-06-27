const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const controller = require('./product.controller');
const validate = require('../../middlewares/validate.middleware');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireActiveRole } = require('../../middlewares/role.middleware');
const { createProductSchema, updateProductSchema } = require('./product.validation');

router.get('/', authenticate, requireActiveRole('SELLER'), controller.getMyProducts);
router.post('/', authenticate, requireActiveRole('SELLER'), upload.single('image'), validate(createProductSchema), controller.createProduct);
router.put('/:id', authenticate, requireActiveRole('SELLER'), upload.single('image'), validate(updateProductSchema), controller.updateProduct);
router.delete('/:id', authenticate, requireActiveRole('SELLER'), controller.deleteProduct);

module.exports = router;