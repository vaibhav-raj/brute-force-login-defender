const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const { jwt_secret } = require("../config/index");

module.exports = async (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer "))
        return res.status(401).json({ message: "Unauthorized" });
    const token = auth.split(" ")[1];
    try {
        const payload = jwt.verify(token, jwt_secret);
        const user = await User.findById(payload?.id);
        if (!user) return res.status(401).json({ message: "Unauthorized" });
        req.user = { id: user._id, email: user.email };
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
};
