const prisma = require('../../config/db');
const { hashPassword, comparePassword } = require('../../utils/hash');
const { generateToken } = require('../../utils/jwt');
const { PREAUTH_EXPIRES_IN } = require('../../config/env');

const sanitizeUser = (user) => ({
    id: user.id,
    username: user.username,
    email: user.email,
    name: user.name,
    roles: user.roles.map((r) => r.role),
});

const register = async ({ username, email, password, name, roles }) => {
    const existing = await prisma.user.findFirst({
        where: { OR: [{ username }, { email }] },
    });

    if (existing) {
        throw { statusCode: 409, message: 'Username or email is already registered' };
    }

    const hashed = await hashPassword(password);

    const user = await prisma.user.create({
        data: {
            username,
            email,
            password: hashed,
            name,
            roles: {
                create: roles.map((role) => ({ role })),
            },
        },
        include: { roles: true },
    });

    return sanitizeUser(user);
};

const login = async ({ username, password }) => {
    const user = await prisma.user.findUnique({
        where: { username },
        include: { roles: true },
    });

    if (!user) {
        throw { statusCode: 401, message: 'Invalid username or password' };
    }

    const match = await comparePassword(password, user.password);
    if (!match) {
        throw { statusCode: 401, message: 'Invalid username or password' };
    }

    const roleList = user.roles.map((r) => r.role);

    if (roleList.length === 0) {
        throw { statusCode: 403, message: 'This account has no assigned role. Contact admin.' };
    }

    // Admin: role tunggal, langsung aktif
    if (roleList.includes('ADMIN')) {
        const token = generateToken({
            userId: user.id,
            username: user.username,
            roles: roleList,
            activeRole: 'ADMIN',
        });

        return {
            requiresRoleSelection: false,
            token,
            roles: roleList,
            activeRole: 'ADMIN',
        };
    }

    // Hanya punya 1 role non-admin -> langsung aktif tanpa perlu pilih
    if (roleList.length === 1) {
        const token = generateToken({
            userId: user.id,
            username: user.username,
            roles: roleList,
            activeRole: roleList[0],
        });

        return {
            requiresRoleSelection: false,
            token,
            roles: roleList,
            activeRole: roleList[0],
        };
    }

    // Punya >1 role non-admin -> harus pilih active role dulu
    const preAuthToken = generateToken(
        {
            userId: user.id,
            username: user.username,
            roles: roleList,
            activeRole: null,
        },
        PREAUTH_EXPIRES_IN
    );

    return {
        requiresRoleSelection: true,
        preAuthToken,
        roles: roleList,
    };
};

const selectRole = async (userPayload, role) => {
    if (!userPayload.roles.includes(role)) {
        throw { statusCode: 403, message: 'You do not own this role' };
    }

    const token = generateToken({
        userId: userPayload.userId,
        username: userPayload.username,
        roles: userPayload.roles,
        activeRole: role,
    });

    return { token, activeRole: role, roles: userPayload.roles };
};

const getProfile = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { roles: true },
    });

    if (!user) {
        throw { statusCode: 404, message: 'User not found' };
    }

    return sanitizeUser(user);
};

const logout = async (decodedToken) => {
    await prisma.revokedToken.create({
        data: {
            jti: decodedToken.jti,
            expiresAt: new Date(decodedToken.exp * 1000),
        },
    });
};

module.exports = { register, login, selectRole, getProfile, logout };