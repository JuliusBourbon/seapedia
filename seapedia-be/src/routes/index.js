const express = require('express');
const router = express.Router();

const authRoutes = require('../modules/auth/auth.routes');
const reviewRoutes = require('../modules/review/review.routes');
const dashboardRoutes = require('../modules/dashboard/dashboard.routes');

router.use('/auth', authRoutes);
router.use('/reviews', reviewRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;