const sanitizeHtml = require('sanitize-html');

const sanitizeText = (input = '') => {
    return sanitizeHtml(input, {
        allowedTags: [],
        allowedAttributes: {},
    }).trim();
};

module.exports = { sanitizeText };