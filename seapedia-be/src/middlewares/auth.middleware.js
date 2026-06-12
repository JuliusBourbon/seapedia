const { verifyToken } = require('../utils/jwt');

// Wajib login, token harus valid (tidak peduli activeRole sudah dipilih atau belum)
const authenticate = (req, res, next) => {
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Missing or invalid authorization header' });
    }

    const token = header.split(' ')[1];

    try {
        req.user = verifyToken(token);
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
};

// Tidak wajib login, tapi kalau ada token valid, req.user akan terisi
// Dipakai untuk endpoint yang boleh diakses guest maupun user login (misal: submit review)
const optionalAuthenticate = (req, res, next) => {
    const header = req.headers.authorization;

    if (header && header.startsWith('Bearer ')) {
        try {
            req.user = verifyToken(header.split(' ')[1]);
        } catch (err) {
            req.user = null;
        }
    } else {
        req.user = null;
    }

    next();
};

module.exports = { authenticate, optionalAuthenticate };