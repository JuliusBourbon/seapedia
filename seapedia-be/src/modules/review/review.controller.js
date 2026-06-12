const reviewService = require('./review.service');
const { success, error } = require('../../utils/responseFormatter');

const createReview = async (req, res, next) => {
    try {
        // Jika user login (req.user terisi dari optionalAuthenticate), kaitkan review dengan userId
        const userId = req.user ? req.user.userId : null;
        const review = await reviewService.createReview(req.body, userId);
        return success(res, 201, 'Review submitted successfully', review);
    } catch (err) {
        return next(err);
    }
};

const getAllReviews = async (req, res, next) => {
    try {
        const reviews = await reviewService.getAllReviews();
        return success(res, 200, 'Reviews retrieved successfully', reviews);
    } catch (err) {
        return next(err);
    }
};

module.exports = { createReview, getAllReviews };