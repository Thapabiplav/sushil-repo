"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const env_1 = require("./config/env");
const errorHandler_1 = require("./middleware/errorHandler");
const database_1 = require("./config/database");
const auth_router_1 = require("./modules/auth/auth.router");
const student_router_1 = require("./modules/student/student.router");
const teacher_router_1 = require("./modules/teacher/teacher.router");
const admin_router_1 = require("./modules/admin/admin.router");
const setup_router_1 = require("./modules/setup/setup.router");
// Import new models for registration
require("./models/TeacherSubjectAssignment");
require("./models/ClassTeacherAssignment");
const admin_service_1 = require("./modules/admin/admin.service");
const auth_controller_1 = require("./modules/auth/auth.controller");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errorHandler_2 = require("./middleware/errorHandler");
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        if (env_1.env.nodeEnv === 'development') {
            const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
            const isLocalNetwork = /^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)/.test(origin);
            if (isLocalhost || isLocalNetwork) {
                return callback(null, true);
            }
        }
        if (env_1.env.corsOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(null, false);
    },
    credentials: true,
}));
app.use(express_1.default.json({ limit: '10mb' }));
// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
});
// Public school profile endpoint (no auth required)
app.get('/api/school/profile', async (_req, res, next) => {
    try {
        const profile = await (0, admin_service_1.getSchoolProfile)();
        res.json(profile);
    }
    catch (error) {
        next(error);
    }
});
// Shared dashboard summary endpoint - accessible by all authenticated roles
app.get('/api/dashboard/summary', auth_controller_1.authenticateToken, async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            throw new errorHandler_2.HttpError(401, 'Authentication required');
        }
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.jwtSecret);
        const role = decoded.role;
        if (!role || !['admin', 'teacher', 'student'].includes(role)) {
            throw new errorHandler_2.HttpError(403, 'Unauthorized access');
        }
        const summary = await (0, admin_service_1.getDashboardSummary)(role);
        res.json(summary);
    }
    catch (error) {
        next(error);
    }
});
// Routers
app.use('/api/auth', auth_router_1.authRouter);
app.use('/api/setup', setup_router_1.setupRouter);
app.use('/api/students', student_router_1.studentRouter);
app.use('/api/teachers', teacher_router_1.teacherRouter);
app.use('/api/admin', admin_router_1.adminRouter);
app.use(errorHandler_1.notFound);
app.use(errorHandler_1.errorHandler);
async function start() {
    try {
        await (0, database_1.testDatabaseConnection)();
        await (0, database_1.syncDatabase)();
        app.listen(env_1.env.port, '127.0.0.1', () => {
            console.log(`Backend listening on http://localhost:${env_1.env.port}`);
        });
    }
    catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}
void start();
//# sourceMappingURL=server.js.map