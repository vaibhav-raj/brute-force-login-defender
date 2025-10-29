const app = require('./app');
const connectDB = require('./config/db');
const { port } = require('./config/index');
const logger = require('./utils/logger');

connectDB();

app.listen(port, () => {
    logger.info(`🚀 Server running on port ${port}`);
});
