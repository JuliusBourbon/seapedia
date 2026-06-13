const { z } = require('zod');

const checkoutSchema = z.object({
    addressId: z.string().uuid(),
    deliveryMethod: z.enum(['INSTANT', 'NEXT_DAY', 'REGULAR']),
    discountCode: z.string().min(1).max(30).optional(),
});

const previewCheckoutSchema = z.object({
    deliveryMethod: z.enum(['INSTANT', 'NEXT_DAY', 'REGULAR']),
    discountCode: z.string().min(1).max(30).optional(),
});

module.exports = { checkoutSchema, previewCheckoutSchema };