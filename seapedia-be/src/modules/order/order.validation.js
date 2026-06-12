const { z } = require('zod');

const checkoutSchema = z.object({
    addressId: z.string().uuid(),
    deliveryMethod: z.enum(['INSTANT', 'NEXT_DAY', 'REGULAR']),
});

module.exports = { checkoutSchema };