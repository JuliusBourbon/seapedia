const prisma = require('../../config/db');
const { sanitizeText } = require('../../utils/sanitize');

const createReview = async ({ reviewerName, rating, comment }, userId = null) => {
    return prisma.applicationReview.create({
        data: {
            reviewerName: sanitizeText(reviewerName),
            rating,
            comment: sanitizeText(comment),
            userId: userId || null,
        },
    });
};

const getAllReviews = async () => {
    return prisma.applicationReview.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            reviewerName: true,
            rating: true,
            comment: true,
            createdAt: true,
            userId: true,
        },
    });
};

module.exports = { createReview, getAllReviews };