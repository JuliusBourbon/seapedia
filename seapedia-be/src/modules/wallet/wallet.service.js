const prisma = require('../../config/db');

const getOrCreateWallet = async (userId) => {
    let wallet = await prisma.wallet.findUnique({ where: { userId } });

    if (!wallet) {
        wallet = await prisma.wallet.create({ data: { userId } });
    }

    return wallet;
};

const getWallet = async (userId) => {
    const wallet = await getOrCreateWallet(userId);
    return { id: wallet.id, balance: Number(wallet.balance) };
};

const topup = async (userId, amount) => {
    const wallet = await getOrCreateWallet(userId);

    const updatedWallet = await prisma.$transaction(async (tx) => {
        const w = await tx.wallet.update({
            where: { id: wallet.id },
            data: { balance: { increment: amount } },
        });

        await tx.walletTransaction.create({
            data: {
                walletId: w.id,
                type: 'TOPUP',
                amount,
                balanceAfter: w.balance,
                description: 'Dummy top-up simulation',
            },
        });

        return w;
    });

    return { balance: Number(updatedWallet.balance) };
};

const getTransactions = async (userId) => {
    const wallet = await getOrCreateWallet(userId);

    const transactions = await prisma.walletTransaction.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: 'desc' },
    });

    return transactions.map((t) => ({
        ...t,
        amount: Number(t.amount),
        balanceAfter: Number(t.balanceAfter),
    }));
};

module.exports = { getWallet, topup, getTransactions };