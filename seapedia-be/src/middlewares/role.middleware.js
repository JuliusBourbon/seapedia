// Harus dipakai SETELAH authenticate
// Cek berdasarkan activeRole, bukan daftar seluruh role yang dimiliki user
const requireActiveRole = (...allowedRoles) => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!req.user.activeRole) {
        return res.status(403).json({
            success: false,
            message: 'No active role selected for this session. Please select a role first.',
        });
    }

    if (!allowedRoles.includes(req.user.activeRole)) {
        return res.status(403).json({
            success: false,
            message: `Forbidden: this action requires role ${allowedRoles.join(' or ')}`,
        });
    }

    next();
};

module.exports = { requireActiveRole };