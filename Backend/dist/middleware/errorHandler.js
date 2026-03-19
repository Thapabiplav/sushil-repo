"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpError = void 0;
exports.notFound = notFound;
exports.errorHandler = errorHandler;
class HttpError extends Error {
    constructor(statusCode, message, details) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
    }
}
exports.HttpError = HttpError;
// 404 handler
function notFound(req, res) {
    res.status(404).json({ message: 'Not Found' });
}
// Central error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function errorHandler(err, req, res, _next) {
    // Log full error details for debugging
    if (err instanceof Error) {
        console.error('Error details:', {
            message: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
            name: err.name,
        });
    }
    else {
        console.error('Unknown error:', err);
    }
    // Log request details for context
    console.error('Request that caused error:', {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('user-agent'),
    });
    if (err instanceof HttpError) {
        return res
            .status(err.statusCode)
            .json({ message: err.message, details: err.details });
    }
    // Handle Sequelize errors
    if (err && typeof err === 'object' && 'name' in err) {
        const sequelizeError = err;
        if (sequelizeError.name === 'SequelizeDatabaseError') {
            return res.status(500).json({
                message: 'Database error',
                details: process.env.NODE_ENV === 'development' ? sequelizeError.message : undefined
            });
        }
        if (sequelizeError.name === 'SequelizeValidationError') {
            return res.status(400).json({
                message: 'Validation error',
                details: process.env.NODE_ENV === 'development' ? sequelizeError.message : undefined
            });
        }
    }
    // Handle Zod validation errors
    if (err && typeof err === 'object' && 'issues' in err) {
        return res.status(400).json({
            message: 'Validation error',
            details: process.env.NODE_ENV === 'development' ? err : undefined
        });
    }
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return res.status(500).json({
        message: 'Internal Server Error',
        details: process.env.NODE_ENV === 'development' ? message : undefined
    });
}
//# sourceMappingURL=errorHandler.js.map