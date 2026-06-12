const express = require('express');
const router = express.Router();

const controller = require('./product.controller');

router.get('/', controller.getPublicProducts);
router.get('/:id', controller.getPublicProductById);

module.exports = router;