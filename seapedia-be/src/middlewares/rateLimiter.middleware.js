const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 menit
    max: 20, // maksimal 20 request per IP per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again after 15 minutes',
    },
});

module.exports = { authLimiter };