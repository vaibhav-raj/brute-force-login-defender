require("dotenv").config();
const path = require("path");
const fs = require("fs");
const logger = require("../utils/logger");

// Determine environment
const env = process.env.NODE_ENV || "dev";
let config = {};

// Load the corresponding config file
const envFile = path.join(__dirname, "env", `${env}.js`);

if (fs.existsSync(envFile)) {
    config = require(envFile);
    logger.info(`Loaded configuration for '${env}' environment.`);
} else {
    logger.warn(`Environment file not found for '${env}', using default (dev)`);
    config = require("./env/dev");
}

// Merge and export final config
module.exports = {
    env,
    ...config,
};
