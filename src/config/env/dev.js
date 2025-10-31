module.exports = {
    port: process.env.PORT || 4000,
    mongoUri: process.env.MONGO_URI,
    jwt_secret: process.env.JWT_SECRET,
    jwt_expiresIn: process.env.JWT_EXPIRES_IN || "1d",

    userWindowMinutes: process.env.USER_WINDOW_MINUTES || 5,

    userFailedThreshold: process.env.USER_FAILED_THRESHOLD || 5,
    userSuspendMinutes: process.env.USER_SUSPEND_MINUTES || 15,

    ipThreshold: process.env.IP_THRESHOLD || 100,
    ipSuspendMinutes: process.env.IP_SUSPEND_MINUTES || 15,

    frontendUrl: process.env.FRONTEND_URL
};
