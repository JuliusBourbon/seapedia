const { z } = require('zod');

const createStoreSchema = z.object({
    name: z.string().min(3).max(100),
    description: z.string().max(1000).optional(),
});

const updateStoreSchema = createStoreSchema.partial();

module.exports = { createStoreSchema, updateStoreSchema };