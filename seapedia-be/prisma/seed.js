require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcrypt');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const admin = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            email: 'admin@seapedia.com',
            password: hashedPassword,
            name: 'SEAPEDIA Admin',
            roles: { create: [{ role: 'ADMIN' }] },
        },
    });

    console.log('Seeded admin user:', admin.username);

    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    const voucher = await prisma.voucher.upsert({
        where: { code: 'SEAVOUCHER10' },
        update: {},
        create: {
            code: 'SEAVOUCHER10',
            type: 'PERCENTAGE',
            value: 10, // 10%
            expiryDate: oneYearFromNow,
            usageLimit: 100,
        },
    });

    console.log('Seeded voucher:', voucher.code);

    const promo = await prisma.promo.upsert({
        where: { code: 'SEAPROMO5K' },
        update: {},
        create: {
            code: 'SEAPROMO5K',
            type: 'FIXED',
            value: 5000, // potongan Rp5.000
            expiryDate: oneYearFromNow,
        },
    });

    console.log('Seeded promo:', promo.code);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });