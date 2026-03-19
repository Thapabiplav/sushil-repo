"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.env = {
    nodeEnv: (_a = process.env.NODE_ENV) !== null && _a !== void 0 ? _a : 'development',
    port: Number((_b = process.env.PORT) !== null && _b !== void 0 ? _b : 4000),
    db: {
        host: (_c = process.env.DB_HOST) !== null && _c !== void 0 ? _c : 'localhost',
        port: Number((_d = process.env.DB_PORT) !== null && _d !== void 0 ? _d : 3306),
        name: (_e = process.env.DB_NAME) !== null && _e !== void 0 ? _e : 'sushil_school',
        user: (_f = process.env.DB_USER) !== null && _f !== void 0 ? _f : 'root',
        password: (_g = process.env.DB_PASSWORD) !== null && _g !== void 0 ? _g : '',
    },
    corsOrigins: ((_h = process.env.CORS_ORIGINS) !== null && _h !== void 0 ? _h : 'http://localhost:3000,http://localhost:5173,http://192.168.0.0/16:3000,http://192.168.0.0/16:5173').split(','),
    jwtSecret: (_j = process.env.JWT_SECRET) !== null && _j !== void 0 ? _j : 'dev-secret-change-me',
    cloudinary: {
        cloudName: (_k = process.env.CLOUDINARY_CLOUD_NAME) !== null && _k !== void 0 ? _k : '',
        apiKey: (_l = process.env.CLOUDINARY_API_KEY) !== null && _l !== void 0 ? _l : '',
        apiSecret: (_m = process.env.CLOUDINARY_API_SECRET) !== null && _m !== void 0 ? _m : '',
    },
};
//# sourceMappingURL=env.js.map