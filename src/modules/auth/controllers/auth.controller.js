const { success } = require('../../../utils/response');
const { getClientIP } = require('../../../utils/getClientIP');
const authService = require('../services/auth.service');

exports.register = async (req, res, next) => {
    try {
        const user = await authService.register(req.body);
        success(res, user, "User registered successfully", 201);
    } catch (err) {
        next(err);
    }
};


exports.login = async (req, res, next) => {
    try {
        const ip = getClientIP(req);
        const user = await authService.login({ ip, ...req.body });
        success(res, user, "User login successfully", 201);
    } catch (err) {
        next(err);
    }
};