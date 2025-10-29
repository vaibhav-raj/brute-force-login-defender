class AppError extends Error {
    constructor({ message, status = 500, errorCode = "INTERNAL_ERROR", details }) {
        super(message);
        this.status = status;
        this.errorCode = errorCode;
        this.details = details;
        this.timestamp = new Date().toISOString();
    }
}

module.exports = { AppError };
