const logger = require('../utils/logger');

module.exports = (err, req, res, next) => {
    logger.error(`${err.module || 'GENERAL'} ERROR: ${err.message}`);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Something went wrong',
    });
};
