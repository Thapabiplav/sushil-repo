"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.validatePasswordStrength = validatePasswordStrength;
exports.changePassword = changePassword;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../../config/env");
const User_1 = require("../../models/User");
const errorHandler_1 = require("../../middleware/errorHandler");
// Strong password validation regex
const PASSWORD_REGEX = {
    minLength: /.{8,}/,
    uppercase: /[A-Z]/,
    lowercase: /[a-z]/,
    number: /[0-9]/,
    special: /[!@#$%^&*(),.?":{}|<>]/,
};
async function login(body) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    const user = await User_1.User.findOne({
        where: { email: body.email, role: body.role },
    });
    if (!user) {
        throw new errorHandler_1.HttpError(401, 'Invalid email or password');
    }
    const valid = await bcryptjs_1.default.compare(body.password, user.passwordHash);
    if (!valid) {
        throw new errorHandler_1.HttpError(401, 'Invalid email or password');
    }
    const token = jsonwebtoken_1.default.sign({
        sub: user.id,
        role: user.role,
        email: user.email,
    }, env_1.env.jwtSecret, { expiresIn: '8h' });
    const responseUser = {
        id: String(user.id),
        email: user.email,
        role: user.role,
        name: user.name,
        phone: (_a = user.phone) !== null && _a !== void 0 ? _a : undefined,
        address: (_b = user.address) !== null && _b !== void 0 ? _b : undefined,
        image: (_c = user.image) !== null && _c !== void 0 ? _c : undefined,
        username: (_d = user.username) !== null && _d !== void 0 ? _d : undefined,
        teacherId: (_e = user.teacherId) !== null && _e !== void 0 ? _e : undefined,
        classTeacherOf: (_f = user.classTeacherOf) !== null && _f !== void 0 ? _f : undefined,
        assignedClasses: (_g = user.assignedClasses) !== null && _g !== void 0 ? _g : undefined,
        class: (_h = user.class) !== null && _h !== void 0 ? _h : undefined,
        rollNumber: (_j = user.rollNumber) !== null && _j !== void 0 ? _j : undefined,
        needsPasswordChange: user.needsPasswordChange,
        passwordUpdatedAt: (_l = (_k = user.passwordUpdatedAt) === null || _k === void 0 ? void 0 : _k.toISOString()) !== null && _l !== void 0 ? _l : undefined,
    };
    return { user: responseUser, token };
}
function validatePasswordStrength(password) {
    const errors = [];
    if (!PASSWORD_REGEX.minLength.test(password)) {
        errors.push('Password must be at least 8 characters long');
    }
    if (!PASSWORD_REGEX.uppercase.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (!PASSWORD_REGEX.lowercase.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    if (!PASSWORD_REGEX.number.test(password)) {
        errors.push('Password must contain at least one number');
    }
    if (!PASSWORD_REGEX.special.test(password)) {
        errors.push('Password must contain at least one special character');
    }
    return { valid: errors.length === 0, errors };
}
async function changePassword(userId, body) {
    const user = await User_1.User.findByPk(userId);
    if (!user) {
        throw new errorHandler_1.HttpError(404, 'User not found');
    }
    // Verify current password
    const validCurrentPassword = await bcryptjs_1.default.compare(body.currentPassword, user.passwordHash);
    if (!validCurrentPassword) {
        throw new errorHandler_1.HttpError(401, 'Current password is incorrect');
    }
    // Validate new password strength
    const { valid, errors } = validatePasswordStrength(body.newPassword);
    if (!valid) {
        throw new errorHandler_1.HttpError(400, 'Password does not meet requirements', errors);
    }
    // Check if new password is same as current password
    const isSamePassword = await bcryptjs_1.default.compare(body.newPassword, user.passwordHash);
    if (isSamePassword) {
        throw new errorHandler_1.HttpError(400, 'New password must be different from current password');
    }
    // Hash new password and update user
    const newPasswordHash = await bcryptjs_1.default.hash(body.newPassword, 10);
    await user.update({
        passwordHash: newPasswordHash,
        needsPasswordChange: false,
        passwordUpdatedAt: new Date(),
    });
    return {
        success: true,
        message: 'Password changed successfully',
    };
}
//# sourceMappingURL=auth.service.js.map