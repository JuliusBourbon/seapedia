const prisma = require('../../config/db');
const { sanitizeText } = require('../../utils/sanitize');

const sanitizeAddressInput = (data) => ({
    ...data,
    label: data.label !== undefined ? sanitizeText(data.label) : data.label,
    recipientName: data.recipientName !== undefined ? sanitizeText(data.recipientName) : data.recipientName,
    fullAddress: data.fullAddress !== undefined ? sanitizeText(data.fullAddress) : data.fullAddress,
    city: data.city !== undefined ? sanitizeText(data.city) : data.city,
});

const getAddresses = async (userId) => {
    return prisma.address.findMany({
        where: { userId },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
};

const createAddress = async (userId, data) => {
    data = sanitizeAddressInput(data);
    const existingCount = await prisma.address.count({ where: { userId } });

    if (data.isDefault) {
        await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }

    // Alamat pertama otomatis jadi default
    const isDefault = existingCount === 0 ? true : !!data.isDefault;

    return prisma.address.create({
        data: { ...data, userId, isDefault },
    });
};

const updateAddress = async (userId, addressId, data) => {
    data = sanitizeAddressInput(data);
    const address = await prisma.address.findUnique({ where: { id: addressId } });

    if (!address || address.userId !== userId) {
        throw { statusCode: 404, message: 'Address not found' };
    }

    if (data.isDefault) {
        await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }

    return prisma.address.update({
        where: { id: addressId },
        data,
    });
};

const deleteAddress = async (userId, addressId) => {
    const address = await prisma.address.findUnique({ where: { id: addressId } });

    if (!address || address.userId !== userId) {
        throw { statusCode: 404, message: 'Address not found' };
    }

    await prisma.address.delete({ where: { id: addressId } });

    // Jika alamat default dihapus, jadikan alamat lain (jika ada) sebagai default
    if (address.isDefault) {
        const next = await prisma.address.findFirst({ where: { userId }, orderBy: { createdAt: 'asc' } });
        if (next) {
            await prisma.address.update({ where: { id: next.id }, data: { isDefault: true } });
        }
    }

    return { id: addressId };
};

module.exports = { getAddresses, createAddress, updateAddress, deleteAddress };