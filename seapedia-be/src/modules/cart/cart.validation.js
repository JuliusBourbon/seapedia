const { z } = require('zod');

const addItemSchema = z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
});

const updateQuantitySchema = z.object({
    quantity: z.number().int().min(0), // 0 = hapus item
});

module.exports = { addItemSchema, updateQuantitySchema };