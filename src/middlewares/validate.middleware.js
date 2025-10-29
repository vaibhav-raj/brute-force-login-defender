const { AppError } = require('../utils/error');
const logger = require('../utils/logger');

function validate(schema) {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, { abortEarly: false });
        if (error) {
            const details = error.details.map((d) => ({
                message: d.message,
                path: d.path,
            }));
            logger.warn(`Validation failed: ${JSON.stringify(details)}`);
            return next(
                new AppError({
                    message: "Validation failed",
                    status: 400,
                    errorCode: "VALIDATION_ERROR",
                    details,
                })
            );
        }
        logger.info(`Validation passed for ${req.method} ${req.originalUrl}`);
        next();
    };
}

module.exports = { validate };
