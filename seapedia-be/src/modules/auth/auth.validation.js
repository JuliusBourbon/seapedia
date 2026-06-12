const { z } = require('zod');

const registerSchema = z.object({
    username: z.string().min(3).max(30),
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(1).max(100),
    // ADMIN tidak boleh didaftarkan lewat endpoint publik
    roles: z.array(z.enum(['BUYER', 'SELLER', 'DRIVER'])).min(1),
});

const loginSchema = z.object({
    username: z.string().min(1),
    password: z.string().min(1),
});

const selectRoleSchema = z.object({
    role: z.enum(['ADMIN', 'BUYER', 'SELLER', 'DRIVER']),
});

module.exports = { registerSchema, loginSchema, selectRoleSchema };