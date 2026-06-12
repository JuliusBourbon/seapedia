const success = (res, statusCode, message, data = null) => {
    return res.status(statusCode).json({ success: true, message, data });
};

const error = (res, statusCode, message, errors = null) => {
    return res.status(statusCode).json({ success: false, message, errors });
};

module.exports = { success, error };