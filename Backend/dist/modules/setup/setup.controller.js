"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupHandler = setupHandler;
exports.checkSetupStatusHandler = checkSetupStatusHandler;
const zod_1 = require("zod");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = require("../../models/User");
const errorHandler_1 = require("../../middleware/errorHandler");
const setupSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required'),
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
});
async function setupHandler(req, res, next) {
    try {
        // Check if admin user already exists
        const existingAdmin = await User_1.User.findOne({ where: { role: 'admin' } });
        if (existingAdmin) {
            throw new errorHandler_1.HttpError(400, 'System has already been set up. Please login with existing credentials.');
        }
        // Validate request body
        const parsed = setupSchema.safeParse(req.body);
        if (!parsed.success) {
            throw new errorHandler_1.HttpError(400, 'Invalid request body', parsed.error.flatten());
        }
        // Check if email is already in use
        const existingUser = await User_1.User.findOne({ where: { email: parsed.data.email } });
        if (existingUser) {
            throw new errorHandler_1.HttpError(400, 'Email is already registered');
        }
        // Create admin user
        const passwordHash = await bcryptjs_1.default.hash(parsed.data.password, 10);
        const admin = await User_1.User.create({
            name: parsed.data.name,
            email: parsed.data.email,
            passwordHash,
            role: 'admin',
            needsPasswordChange: false,
        });
        res.status(201).json({
            message: 'Admin user created successfully',
            user: {
                id: admin.id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
            },
        });
    }
    catch (err) {
        next(err);
    }
}
async function checkSetupStatusHandler(_req, res, next) {
    try {
        const adminExists = await User_1.User.findOne({ where: { role: 'admin' } });
        res.json({ needsSetup: !adminExists });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=setup.controller.js.map