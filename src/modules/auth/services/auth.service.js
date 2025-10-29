// src/modules/auth/services/auth.service.js
const jwt = require("jsonwebtoken");
const { AuthError } = require("../errors/AuthError");
const User = require("../../../models/user.model");
const FailedLoginAttempt = require("../../../models/failed-login-attempt.model");
const { ENUM_COMMON_STATUS } = require("../../../utils/constants");
const IPBlock = require("../../../models/ip-block.model");
const logger = require("../../../utils/logger");
const {
    jwt_secret,
    jwt_expiresIn,
    userWindowMinutes,
    userFailedThreshold,
    userSuspendMinutes,
    ipThreshold,
    ipSuspendMinutes,
} = require("../../../config/index");

exports.register = async (body) => {
    logger.info(`register started with body: ${JSON.stringify(body)}`);
    const { email, password, name } = body;

    const existing = await User.findOne({ email });
    if (existing) {
        logger.warn(`register failed — Email already exists: ${email}`);
        throw new AuthError({
            message: "Email already exists",
            status: 400,
            errorCode: "AUTH_EMAIL_EXISTS",
        });
    }

    const user = await User.create({ email, password, name });
    logger.info(`New user registered: ${email}`);
    return user;
};

const getAttemptWindowStart = () =>
    new Date(Date.now() - userWindowMinutes * 60 * 1000);

exports.login = async (body) => {
    logger.info(`login  - process started with payload: ${JSON.stringify(body)}`);
    const { email, password, ip = "anonymous" } = body;
    const emailLower = (email || "").toLowerCase();

    logger.debug(`login - email: ${emailLower}, ip: ${ip}`);

    //check ip block
    await checkIpBlock(ip);

    //find user by email
    const userDoc = await User.findOne({ email: emailLower }).select("+password");
    if (!userDoc) {
        logger.warn(`login - failed — user not found: ${emailLower}`);
        throw new AuthError({
            message: "Invalid credentials",
            status: 401,
            errorCode: "AUTH_INVALID_CREDENTIALS",
        });
    }

    logger.debug(`login - email found - ${emailLower}`);

    // Check for account suspension
    const now = new Date();
    if (userDoc?.suspendedUntil > now) {
        // Extend the suspension by another minutes
        const extendedUntil = new Date(
            userDoc.suspendedUntil.getTime() + userSuspendMinutes * 60 * 1000
        );
        await User.updateOne(
            { _id: userDoc._id },
            { $set: { suspendedUntil: extendedUntil } }
        );

        logger.warn(
            `login - user ${emailLower} attempted login while suspended — suspension extended by ${userSuspendMinutes} minutes}.`
        );

        await handleFailedLoginAttempt({ userDoc, ip });
    }

    //verify password
    const isValid = await userDoc.comparePassword(password);
    if (!isValid) {
        logger.warn(`login - Invalid password for ${emailLower}`);
        await handleFailedLoginAttempt({ userDoc, ip });
    }

    logger.debug(
        `login - password validation result for ${emailLower}: ${isValid}`
    );

    // clear suspension & failed attempts on successful login
    await User.updateOne(
        { _id: userDoc._id },
        { $set: { suspendedUntil: null } }
    );
    await FailedLoginAttempt.deleteMany({ user: userDoc._id });

    //generate token
    const token = jwt.sign(
        { id: userDoc?._id.toString(), email: userDoc?.email },
        jwt_secret,
        { expiresIn: jwt_expiresIn }
    );

    const user = userDoc.toObject();
    delete user.password;

    logger.info(`login - successful for: ${emailLower}`);
    return { user, token };
};

async function handleFailedLoginAttempt({ userDoc, ip }) {
    logger.info(
        `handleFailedLoginAttempt - started for user:${userDoc._id}, ip: ${ip}`
    );

    //create the failed attempt
    await FailedLoginAttempt.create({ user: userDoc?._id, ip });

    // monitoring window - last X minutes
    const windowStart = getAttemptWindowStart();

    // Count failed attempts in the current window (by user and IP)
    const [userFailedCount, ipFailedCount] = await Promise.all([
        FailedLoginAttempt.countDocuments({
            user: userDoc._id,
            createdAt: { $gte: windowStart },
        }),
        FailedLoginAttempt.countDocuments({ ip, createdAt: { $gte: windowStart } }),
    ]);

    logger.debug(
        `handleFailedLoginAttempt - userFailedCount=${userFailedCount}, ipFailedCount=${ipFailedCount}`
    );

    // Suspend user if threshold exceeded
    if (userDoc && userFailedCount >= userFailedThreshold) {
        const suspendedUntil = new Date(
            Date.now() + userSuspendMinutes * 60 * 1000
        );

        await User.updateOne({ _id: userDoc._id }, { $set: { suspendedUntil } });

        logger.warn(
            `handleFailedLoginAttempt - User suspended user: ${userDoc._id
            } until ${suspendedUntil.toISOString()}`
        );
    }

    // Block IP if threshold exceeded
    if (ipFailedCount >= ipThreshold) {
        const blockedUntil = new Date(Date.now() + ipSuspendMinutes * 60 * 1000);

        await IPBlock.updateOne(
            { ip },
            { $set: { blockedUntil, status: ENUM_COMMON_STATUS.ACTIVE } },
            { upsert: true }
        );
        logger.warn(
            `handleFailedLoginAttempt - IP blocked: ${ip} until ${blockedUntil.toISOString()}`
        );
        throw new AuthError({
            message: `IP temporarily blocked due to excessive failed login attempts.`,
            status: 429,
            errorCode: "IP_BLOCKED",
        });
    }

    let message;
    if (userFailedCount < userFailedThreshold) {
        message = `Invalid credentials. ${userFailedCount}/${userFailedThreshold} failed attempts in the last ${userWindowMinutes} minute${userWindowMinutes > 1 ? "s" : ""}.`;
    } else {
        message = `Account temporarily suspended due to too many failed attempts.`;
    }

    logger.info(`handleFailedLoginAttempt - ended for ip: ${ip}, ${message} `);

    throw new AuthError({
        message,
        status: 401,
        errorCode: "AUTH_INVALID_CREDENTIALS",
    });
}

async function checkIpBlock(ip) {
    logger.info(`checkIpBlock - check IP block for: ${ip} `);

    const existingIpBlock = await IPBlock.findOne({
        ip,
        status: ENUM_COMMON_STATUS.ACTIVE,
    });

    const now = new Date();

    if (!existingIpBlock) {
        logger.debug(`checkIpBlock - No active IP block found for ${ip}`);
        return;
    }

    //  IP blocked
    if (existingIpBlock?.blockedUntil > now) {
        throw new AuthError({
            message: `IP temporarily blocked due to excessive failed login attempts.`,
            status: 429,
            errorCode: "IP_BLOCKED",
        });
    }

    logger.debug(
        `checkIpBlock - IP block for ${ip} has expired.Marking as ${ENUM_COMMON_STATUS.INACTIVE} `
    );

    await IPBlock.updateOne(
        { _id: existingIpBlock._id },
        { $set: { status: ENUM_COMMON_STATUS.INACTIVE } }
    );

    logger.info(`checkIpBlock - IP block expired and updated for ${ip}`);
}
