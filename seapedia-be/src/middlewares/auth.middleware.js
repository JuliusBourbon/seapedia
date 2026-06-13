const prisma = require('../config/db');
const { verifyToken } = require('../utils/jwt');

const authenticate = async (req, res, next) => {
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Missing or invalid authorization header' });
    }

    const token = header.split(' ')[1];

    try {
        const decoded = verifyToken(token);

        const revoked = await prisma.revokedToken.findUnique({ where: { jti: decoded.jti } });
        if (revoked) {
            return res.status(401).json({ success: false, message: 'Token has been revoked. Please login again.' });
        }

        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
};

const optionalAuthenticate = async (req, res, next) => {
    const header = req.headers.authorization;

    if (header && header.startsWith('Bearer ')) {
        try {
            const decoded = verifyToken(header.split(' ')[1]);
            const revoked = await prisma.revokedToken.findUnique({ where: { jti: decoded.jti } });
            req.user = revoked ? null : decoded;
        } catch (err) {
            req.user = null;
        }
    } else {
        req.user = null;
    }

    next();
};

module.exports = { authenticate, optionalAuthenticate };