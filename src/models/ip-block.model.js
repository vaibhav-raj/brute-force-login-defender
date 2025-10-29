const mongoose = require('mongoose');
const { ENUM_COMMON_STATUS } = require('../utils/constants');

const IPBlockSchema = new mongoose.Schema({
    ip: { type: String, required: true, unique: true },
    blockedUntil: { type: Date, required: true },
    status: { type: String, enum: Object.values(ENUM_COMMON_STATUS), default: 'active' },
    reason: { type: String, default: 'ip_threshold' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('IPBlock', IPBlockSchema);
