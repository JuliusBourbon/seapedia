const express = require('express');
const router = express.Router();

const controller = require('./store.controller');

// Public store detail — guest boleh akses
router.get('/:id', controller.getStoreById);

module.exports = router;