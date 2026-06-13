const { z } = require('zod');

const baseDiscountSchema = z.object({
    code: z.string().min(3).max(30),
    type: z.enum(['PERCENTAGE', 'FIXED']),
    value: z.number().positive(),
    expiryDate: z.string().datetime(),
});

const createVoucherSchema = baseDiscountSchema
    .extend({
        usageLimit: z.number().int().positive(),
    })
    .refine((data) => data.type !== 'PERCENTAGE' || data.value <= 100, {
        message: 'Percentage value must be between 0 and 100',
        path: ['value'],
    });

const createPromoSchema = baseDiscountSchema.refine(
    (data) => data.type !== 'PERCENTAGE' || data.value <= 100,
    { message: 'Percentage value must be between 0 and 100', path: ['value'] }
);

module.exports = { createVoucherSchema, createPromoSchema };