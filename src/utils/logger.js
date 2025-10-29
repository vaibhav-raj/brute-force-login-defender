const winston = require('winston');

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'debug', // capture all levels by default
    format: winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ level, message, timestamp }) => {
            return `[${timestamp}] ${level}: ${message}`;
        })
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({
            filename: 'logs/app.log',
            level: process.env.LOG_LEVEL || 'debug'
        }),
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error'
        })
    ],
});

module.exports = logger;
