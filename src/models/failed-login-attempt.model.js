const mongoose = require("mongoose");

const FailedLoginAttemptSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    ip: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 60 }
});

module.exports = mongoose.model("FailedLoginAttempt", FailedLoginAttemptSchema);
