const express = require("express");
const app = express();
const routes = require("./routes");
const loggerMiddleware = require("./middlewares/logger.middleware");
const errorHandler = require("./middlewares/error.middleware");

app.use(express.json());
app.use(loggerMiddleware);

app.use(
    cors({
        origin: process.env.FRONTEND_URL || "*",
    })
);

app.get("/api/v1/health", (req, res) => {
    if (process.env.NODE_ENV !== "test") {
        console.log(`[${new Date().toISOString()}] Health check ping`);
    }
    res.status(200).json({ success: true, message: "Server is healthy 🚀" });
});

app.use("/api/v1", routes);
app.use(errorHandler);

module.exports = app;
