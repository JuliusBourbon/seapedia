const reportService = require('./report.service');
const { success } = require('../../utils/responseFormatter');

const getBuyerReport = async (req, res, next) => {
    try {
        const report = await reportService.getBuyerReport(req.user.userId);
        return success(res, 200, 'Buyer report retrieved successfully', report);
    } catch (err) {
        return next(err);
    }
};

const getSellerReport = async (req, res, next) => {
    try {
        const report = await reportService.getSellerReport(req.user.userId);
        return success(res, 200, 'Seller report retrieved successfully', report);
    } catch (err) {
        return next(err);
    }
};

module.exports = { getBuyerReport, getSellerReport };