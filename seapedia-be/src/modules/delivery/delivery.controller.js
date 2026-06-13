const deliveryService = require('./delivery.service');
const { success } = require('../../utils/responseFormatter');

const getAvailableJobs = async (req, res, next) => {
    try {
        const jobs = await deliveryService.getAvailableJobs();
        return success(res, 200, 'Available jobs retrieved successfully', jobs);
    } catch (err) {
        return next(err);
    }
};

const getJobById = async (req, res, next) => {
    try {
        const job = await deliveryService.getJobById(req.params.id);
        return success(res, 200, 'Job retrieved successfully', job);
    } catch (err) {
        return next(err);
    }
};

const takeJob = async (req, res, next) => {
    try {
        const job = await deliveryService.takeJob(req.user.userId, req.params.id);
        return success(res, 200, 'Job taken successfully', job);
    } catch (err) {
        return next(err);
    }
};

const completeJob = async (req, res, next) => {
    try {
        const job = await deliveryService.completeJob(req.user.userId, req.params.id);
        return success(res, 200, 'Job completed successfully', job);
    } catch (err) {
        return next(err);
    }
};

const getActiveJob = async (req, res, next) => {
    try {
        const job = await deliveryService.getActiveJob(req.user.userId);
        return success(res, 200, job ? 'Active job retrieved' : 'No active job', job);
    } catch (err) {
        return next(err);
    }
};

const getJobHistory = async (req, res, next) => {
    try {
        const jobs = await deliveryService.getJobHistory(req.user.userId);
        return success(res, 200, 'Job history retrieved successfully', jobs);
    } catch (err) {
        return next(err);
    }
};

const getEarningsSummary = async (req, res, next) => {
    try {
        const summary = await deliveryService.getEarningsSummary(req.user.userId);
        return success(res, 200, 'Earnings summary retrieved successfully', summary);
    } catch (err) {
        return next(err);
    }
};

module.exports = {
    getAvailableJobs,
    getJobById,
    takeJob,
    completeJob,
    getActiveJob,
    getJobHistory,
    getEarningsSummary,
};