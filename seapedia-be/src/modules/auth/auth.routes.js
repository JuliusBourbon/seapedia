const express = require('express');
const router = express.Router();

const authController = require('./auth.controller');
const validate = require('../../middlewares/validate.middleware');
const { authenticate } = require('../../middlewares/auth.middleware');
const { registerSchema, loginSchema, selectRoleSchema } = require('./auth.validation');

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);

// authenticate dipakai karena perlu decode preAuthToken (activeRole masih null)
router.post('/select-role', authenticate, validate(selectRoleSchema), authController.selectRole);

router.get('/me', authenticate, authController.me);
router.post('/logout', authenticate, authController.logout);

module.exports = router;