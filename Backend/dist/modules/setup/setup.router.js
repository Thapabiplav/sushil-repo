"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupRouter = void 0;
const express_1 = require("express");
const setup_controller_1 = require("./setup.controller");
const router = (0, express_1.Router)();
exports.setupRouter = router;
// Check if system needs setup (no admin user exists)
router.get('/status', setup_controller_1.checkSetupStatusHandler);
// Setup the system with initial admin user
router.post('/setup', setup_controller_1.setupHandler);
//# sourceMappingURL=setup.router.js.map