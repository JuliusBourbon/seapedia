const express = require('express');
const router = express.Router();

const reviewController = require('./review.controller');
const validate = require('../../middlewares/validate.middleware');
const { optionalAuthenticate } = require('../../middlewares/auth.middleware');
const { createReviewSchema } = require('./review.validation');

// Guest maupun user login boleh submit review
router.post('/', optionalAuthenticate, validate(createReviewSchema), reviewController.createReview);
router.get('/', reviewController.getAllReviews);

module.exports = router;