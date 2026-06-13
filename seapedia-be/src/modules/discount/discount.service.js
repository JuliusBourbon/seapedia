const prisma = require('../../config/db');

const formatVoucher = (v) => ({ ...v, value: Number(v.value) });
const formatPromo = (p) => ({ ...p, value: Number(p.value) });

// Diskon dihitung dari subtotal, dibatasi maksimal sebesar subtotal (tidak boleh negatif)
const calculateDiscountAmount = (type, value, subtotal) => {
    const v = Number(value);
    let amount = type === 'PERCENTAGE' ? (subtotal * v) / 100 : v;
    amount = Math.min(amount, subtotal);
    return Math.round(amount);
};

// Dipakai saat checkout/preview. Mengecek Voucher dulu, baru Promo.
// Voucher dan Promo dibedakan lewat field `source` pada hasil validasi.
const validateDiscountCode = async (code, subtotal) => {
    const voucher = await prisma.voucher.findUnique({ where: { code } });

    if (voucher) {
        if (!voucher.isActive) {
            throw { statusCode: 400, message: 'Voucher is not active' };
        }
        if (voucher.expiryDate < new Date()) {
            throw { statusCode: 400, message: 'Voucher has expired' };
        }
        if (voucher.usedCount >= voucher.usageLimit) {
            throw { statusCode: 400, message: 'Voucher usage limit has been reached' };
        }

        return {
            source: 'VOUCHER',
            code: voucher.code,
            type: voucher.type,
            value: Number(voucher.value),
            amount: calculateDiscountAmount(voucher.type, voucher.value, subtotal),
            remainingUsage: voucher.usageLimit - voucher.usedCount,
            expiryDate: voucher.expiryDate,
        };
    }

    const promo = await prisma.promo.findUnique({ where: { code } });

    if (promo) {
        if (!promo.isActive) {
            throw { statusCode: 400, message: 'Promo is not active' };
        }
        if (promo.expiryDate < new Date()) {
            throw { statusCode: 400, message: 'Promo has expired' };
        }

        return {
            source: 'PROMO',
            code: promo.code,
            type: promo.type,
            value: Number(promo.value),
            amount: calculateDiscountAmount(promo.type, promo.value, subtotal),
            expiryDate: promo.expiryDate,
        };
    }

    throw { statusCode: 404, message: 'Discount code not found' };
};

// ===== Admin: Voucher =====

const createVoucher = async (data) => {
    const existing = await prisma.voucher.findUnique({ where: { code: data.code } });
    if (existing) {
        throw { statusCode: 409, message: 'Voucher code already exists' };
    }

    const voucher = await prisma.voucher.create({
        data: { ...data, expiryDate: new Date(data.expiryDate) },
    });

    return formatVoucher(voucher);
};

const listVouchers = async () => {
    const vouchers = await prisma.voucher.findMany({ orderBy: { createdAt: 'desc' } });
    return vouchers.map(formatVoucher);
};

const getVoucherByCode = async (code) => {
    const voucher = await prisma.voucher.findUnique({ where: { code } });
    if (!voucher) {
        throw { statusCode: 404, message: 'Voucher not found' };
    }
    return formatVoucher(voucher);
};

// ===== Admin: Promo =====

const createPromo = async (data) => {
    const existing = await prisma.promo.findUnique({ where: { code: data.code } });
    if (existing) {
        throw { statusCode: 409, message: 'Promo code already exists' };
    }

    const promo = await prisma.promo.create({
        data: { ...data, expiryDate: new Date(data.expiryDate) },
    });

    return formatPromo(promo);
};

const listPromos = async () => {
    const promos = await prisma.promo.findMany({ orderBy: { createdAt: 'desc' } });
    return promos.map(formatPromo);
};

const getPromoByCode = async (code) => {
    const promo = await prisma.promo.findUnique({ where: { code } });
    if (!promo) {
        throw { statusCode: 404, message: 'Promo not found' };
    }
    return formatPromo(promo);
};

module.exports = {
    validateDiscountCode,
    createVoucher,
    listVouchers,
    getVoucherByCode,
    createPromo,
    listPromos,
    getPromoByCode,
};