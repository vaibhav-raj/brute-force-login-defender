const mongoose = require('mongoose');
const logger = require('../utils/logger');
const config = require("./index");

async function connectDB() {
    try {
        await mongoose.connect(config.mongoUri);
        logger.info(`MongoDB connected to ${config.mongoUri}`);
    } catch (err) {
        logger.error(`MongoDB connection error: ${err.message}`);
        process.exit(1);
    }
}

module.exports = connectDB;
