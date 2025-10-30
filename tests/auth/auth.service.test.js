
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const User = require("../../src/models/user.model");
const IPBlock = require("../../src/models/ip-block.model");
const FailedLoginAttempt = require("../../src/models/failed-login-attempt.model");
const authService = require("../../src/modules/auth/services/auth.service");
const { AuthError } = require("../../src/modules/auth/errors/AuthError");

describe("Auth Service - Brute Force Protection", () => {
    let mongoServer;
    const testName = "Test User";
    const testEmail = "testuser@example.com";
    const testPassword = "password123";
    const testIP = "127.0.0.1";

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        await mongoose.connect(mongoServer.getUri());
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    beforeEach(async () => {
        await User.deleteMany({});
        await IPBlock.deleteMany({});
        await FailedLoginAttempt.deleteMany({});
        await User.create({ email: testEmail, password: testPassword, name: testName, });
    });

    test("✅ should allow valid user to log in successfully", async () => {
        const response = await authService.login({ email: testEmail, password: testPassword, ip: testIP });
        expect(response).toHaveProperty("token");
        expect(response.user.email).toBe(testEmail);
    });

    test("🚫 should suspend user after 5 failed attempts", async () => {
        let error;
        for (let i = 0; i < 5; i++) {
            try {
                await authService.login({ email: testEmail, password: "wrongpassword", ip: testIP });
            } catch (err) {
                error = err;
            }
        }

        expect(error).toBeInstanceOf(AuthError);
        const user = await User.findOne({ email: testEmail });
        expect(user.suspendedUntil).not.toBeNull();
    });

    test("🚫 should block IP after 100 failed attempts (simulated)", async () => {
        let error;
        for (let i = 0; i < 100; i++) {
            try {
                await authService.login({ email: testEmail, password: "wrongpassword", ip: testIP });
            } catch (err) {
                error = err;
            }
        }

        expect(error).toBeInstanceOf(AuthError);
        expect(error.message).toMatch(/IP temporarily blocked/i);

        const ipRecord = await IPBlock.findOne({ ip: testIP });
        expect(ipRecord).not.toBeNull();
    });

    test("♻️ should clear failed attempts after successful login", async () => {
        // Fail twice
        for (let i = 0; i < 2; i++) {
            try {
                await authService.login({ email: testEmail, password: "wrongpassword", ip: testIP });
            } catch (_) { }
        }

        // Successful login
        const response = await authService.login({ email: testEmail, password: testPassword, ip: testIP });
        expect(response).toHaveProperty("token");

        // Failed attempts should be cleared
        const remainingAttempts = await FailedLoginAttempt.countDocuments({ ip: testIP });
        expect(remainingAttempts).toBe(0);
    });
});
