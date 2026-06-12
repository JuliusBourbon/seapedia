const { z } = require('zod');

const topupSchema = z.object({
    amount: z.number().positive(),
});

module.exports = { topupSchema };