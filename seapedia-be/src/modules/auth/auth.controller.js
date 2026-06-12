const authService = require('./auth.service');
const { success, error } = require('../../utils/responseFormatter');

const register = async (req, res, next) => {
    try {
        const user = await authService.register(req.body);
        return success(res, 201, 'Registration successful', user);
    } catch (err) {
        return next(err);
    }
};

const login = async (req, res, next) => {
    try {
        const result = await authService.login(req.body);

        if (result.requiresRoleSelection) {
            return success(res, 200, 'Multiple roles found. Please select an active role.', {
                requiresRoleSelection: true,
                preAuthToken: result.preAuthToken,
                roles: result.roles,
            });
        }

        return success(res, 200, 'Login successful', {
            requiresRoleSelection: false,
            token: result.token,
            roles: result.roles,
            activeRole: result.activeRole,
        });
    } catch (err) {
        return next(err);
    }
};

const selectRole = async (req, res, next) => {
    try {
        const result = await authService.selectRole(req.user, req.body.role);
        return success(res, 200, 'Active role set', result);
    } catch (err) {
        return next(err);
    }
};

const me = async (req, res, next) => {
    try {
        const profile = await authService.getProfile(req.user.userId);
        return success(res, 200, 'Profile retrieved', {
            ...profile,
            activeRole: req.user.activeRole,
        });
    } catch (err) {
        return next(err);
    }
};

const logout = async (req, res, next) => {
    // Stateless JWT: instruksikan client untuk menghapus token.
    // Catatan implementasi token blacklist (opsional) didokumentasikan di README.
    return success(res, 200, 'Logout successful. Please discard your token on the client.');
};

module.exports = { register, login, selectRole, me, logout };