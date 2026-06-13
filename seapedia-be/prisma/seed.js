require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcrypt');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            email: 'admin@seapedia.com',
            password: adminPassword,
            name: 'SEAPEDIA Admin',
            roles: { create: [{ role: 'ADMIN' }] },
        },
    });
    console.log('Seeded admin:', admin.username);

    // SELLERRE + PRODUCTS
    const sellerPassword = await bcrypt.hash('seller123', 10);
    const seller = await prisma.user.upsert({
        where: { username: 'seller1' },
        update: {},
        create: {
            username: 'seller1',
            email: 'seller1@seapedia.com',
            password: sellerPassword,
            name: 'Seller Demo',
            roles: { create: [{ role: 'SELLER' }] },
        },
    });
    console.log('Seeded seller:', seller.username);

    const store = await prisma.store.upsert({
        where: { sellerId: seller.id },
        update: {},
        create: {
            name: 'Toko Demo Seapedia',
            description: 'Toko contoh untuk keperluan demo dan testing',
            sellerId: seller.id,
        },
    });
    console.log('Seeded store:', store.name);

    const productCount = await prisma.product.count({ where: { storeId: store.id } });
    if (productCount === 0) {
        await prisma.product.createMany({
            data: [
                { name: 'Kaos Polos Hitam', description: 'Kaos katun combed 30s, nyaman dipakai harian', price: 75000, stock: 50, storeId: store.id },
                { name: 'Topi Baseball', description: 'Topi adjustable, cocok untuk gaya kasual', price: 45000, stock: 30, storeId: store.id },
                { name: 'Tote Bag Canvas', description: 'Tas kanvas tebal, muat banyak barang', price: 60000, stock: 20, storeId: store.id },
            ],
        });
        console.log('Seeded 3 demo products for store:', store.name);
    }

    // BUYER ET + ADDRESS
    const buyerPassword = await bcrypt.hash('buyer123', 10);
    const buyer = await prisma.user.upsert({
        where: { username: 'buyer1' },
        update: {},
        create: {
            username: 'buyer1',
            email: 'buyer1@seapedia.com',
            password: buyerPassword,
            name: 'Buyer Demo',
            roles: { create: [{ role: 'BUYER' }] },
        },
    });
    console.log('Seeded buyer:', buyer.username);

    await prisma.wallet.upsert({
        where: { userId: buyer.id },
        update: {},
        create: { userId: buyer.id, balance: 1000000 },
    });

    const addressCount = await prisma.address.count({ where: { userId: buyer.id } });
    if (addressCount === 0) {
        await prisma.address.create({
            data: {
                userId: buyer.id,
                label: 'Rumah',
                recipientName: 'Buyer Demo',
                phoneNumber: '081234567890',
                fullAddress: 'Jl. Contoh Raya No. 123, RT 01 RW 02',
                city: 'Jakarta Selatan',
                postalCode: '12345',
                isDefault: true,
            },
        });
        console.log('Seeded default address for buyer1');
    }

    // DRIVER
    const driverPassword = await bcrypt.hash('driver123', 10);
    const driver = await prisma.user.upsert({
        where: { username: 'driver1' },
        update: {},
        create: {
            username: 'driver1',
            email: 'driver1@seapedia.com',
            password: driverPassword,
            name: 'Driver Demo',
            roles: { create: [{ role: 'DRIVER' }] },
        },
    });
    console.log('Seeded driver:', driver.username);

    // MULTI-EMO USER (BUYER + SELLER)
    const multiPassword = await bcrypt.hash('multi123', 10);
    const multiUser = await prisma.user.upsert({
        where: { username: 'multirole1' },
        update: {},
        create: {
            username: 'multirole1',
            email: 'multirole1@seapedia.com',
            password: multiPassword,
            name: 'Multi Role Demo',
            roles: { create: [{ role: 'BUYER' }, { role: 'SELLER' }] },
        },
    });
    console.log('Seeded multi-role demo user:', multiUser.username, '(roles: BUYER, SELLER)');

    // VOUCHEOMO
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    await prisma.voucher.upsert({
        where: { code: 'SEAVOUCHER10' },
        update: {},
        create: { code: 'SEAVOUCHER10', type: 'PERCENTAGE', value: 10, expiryDate: oneYearFromNow, usageLimit: 100 },
    });

    await prisma.promo.upsert({
        where: { code: 'SEAPROMO5K' },
        update: {},
        create: { code: 'SEAPROMO5K', type: 'FIXED', value: 5000, expiryDate: oneYearFromNow },
    });

    console.log('Seeded voucher SEAVOUCHER10 and promo SEAPROMO5K');
    console.log('\n=== Demo Accounts ===');
    console.log('Admin     -> username: admin       | password: admin123');
    console.log('Seller    -> username: seller1     | password: seller123');
    console.log('Buyer     -> username: buyer1      | password: buyer123  (wallet balance: Rp1.000.000)');
    console.log('Driver    -> username: driver1     | password: driver123');
    console.log('Multi-role-> username: multirole1  | password: multi123  (roles: BUYER + SELLER)');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });