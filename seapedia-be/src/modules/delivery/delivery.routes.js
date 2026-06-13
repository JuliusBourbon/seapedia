const express = require('express');
const router = express.Router();

const controller = require('./delivery.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireActiveRole } = require('../../middlewares/role.middleware');

// Mounted at /driver
router.get('/jobs', authenticate, requireActiveRole('DRIVER'), controller.getAvailableJobs);
router.get('/jobs/active', authenticate, requireActiveRole('DRIVER'), controller.getActiveJob);
router.get('/jobs/history', authenticate, requireActiveRole('DRIVER'), controller.getJobHistory);
router.get('/jobs/:id', authenticate, requireActiveRole('DRIVER'), controller.getJobById);
router.post('/jobs/:id/take', authenticate, requireActiveRole('DRIVER'), controller.takeJob);
router.post('/jobs/:id/complete', authenticate, requireActiveRole('DRIVER'), controller.completeJob);

router.get('/earnings', authenticate, requireActiveRole('DRIVER'), controller.getEarningsSummary);

module.exports = router;