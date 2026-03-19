import type { NextFunction, Request, Response } from 'express';

export class HttpError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

// 404 handler
export function notFound(req: Request, res: Response) {
  res.status(404).json({ message: 'Not Found' });
}

// Central error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  // Log full error details for debugging
  if (err instanceof Error) {
    console.error('Error details:', {
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      name: err.name,
    });
  } else {
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
    const sequelizeError = err as { name: string; message: string };
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

