const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    suspendedUntil: { type: Date, default: null },
}, { timestamps: true });

UserSchema.index({ suspendedUntil: 1 });

UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
});

UserSchema.methods.comparePassword = function (password) {
    return bcryptjs.compare(password, this.password);
};

module.exports = mongoose.model('User', UserSchema);