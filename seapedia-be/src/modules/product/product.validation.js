const { z } = require('zod');

const createProductSchema = z.object({
    name: z.string().min(1).max(150),
    description: z.string().max(2000).optional(),
    price: z.number().positive(),
    stock: z.number().int().min(0),
});

const updateProductSchema = createProductSchema.partial();

module.exports = { createProductSchema, updateProductSchema };