const { z } = require('zod');

const addressSchema = z.object({
    label: z.string().min(1).max(50),
    recipientName: z.string().min(1).max(100),
    phoneNumber: z.string().min(5).max(20),
    fullAddress: z.string().min(1).max(500),
    city: z.string().min(1).max(100),
    postalCode: z.string().min(1).max(10),
    isDefault: z.boolean().optional(),
});

const updateAddressSchema = addressSchema.partial();

module.exports = { addressSchema, updateAddressSchema };