"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginHandler = loginHandler;
exports.changePasswordHandler = changePasswordHandler;
exports.authenticateToken = authenticateToken;
const zod_1 = require("zod");
const auth_service_1 = require("./auth.service");
const errorHandler_1 = require("../../middleware/errorHandler");
const env_1 = require("../../config/env");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
    role: zod_1.z.enum(['admin', 'teacher', 'student']),
});
const changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1, 'Current password is required'),
    newPassword: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
});
// Middleware to verify JWT token and extract user
async function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        throw new errorHandler_1.HttpError(401, 'Authentication required');
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.jwtSecret);
        req.user = decoded;
        next();
    }
    catch {
        throw new errorHandler_1.HttpError(401, 'Invalid or expired token');
    }
}
async function loginHandler(req, res, next) {
    try {
        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) {
            throw new errorHandler_1.HttpError(400, 'Invalid request body', parsed.error.flatten());
        }
        const result = await (0, auth_service_1.login)(parsed.data);
        return res.json(result);
    }
    catch (err) {
        next(err);
    }
}
async function changePasswordHandler(req, res, next) {
    try {
        const parsed = changePasswordSchema.safeParse(req.body);
        if (!parsed.success) {
            throw new errorHandler_1.HttpError(400, 'Invalid request body', parsed.error.flatten());
        }
        const userId = req.user.sub;
        const result = await (0, auth_service_1.changePassword)(userId, parsed.data);
        return res.json(result);
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=auth.controller.js.map