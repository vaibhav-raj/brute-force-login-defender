const logger = require('../utils/logger');

module.exports = (req, res, next) => {
    logger.info(`${req.method} ${req.originalUrl} | Body: ${JSON.stringify(req.body)}`);
    next();
};
