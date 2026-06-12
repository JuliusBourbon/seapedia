const walletService = require('./wallet.service');
const { success } = require('../../utils/responseFormatter');

const getWallet = async (req, res, next) => {
    try {
        const wallet = await walletService.getWallet(req.user.userId);
        return success(res, 200, 'Wallet retrieved successfully', wallet);
    } catch (err) {
        return next(err);
    }
};

const topup = async (req, res, next) => {
    try {
        const wallet = await walletService.topup(req.user.userId, req.body.amount);
        return success(res, 200, 'Top-up successful', wallet);
    } catch (err) {
        return next(err);
    }
};

const getTransactions = async (req, res, next) => {
    try {
        const transactions = await walletService.getTransactions(req.user.userId);
        return success(res, 200, 'Wallet transactions retrieved successfully', transactions);
    } catch (err) {
        return next(err);
    }
};

module.exports = { getWallet, topup, getTransactions };