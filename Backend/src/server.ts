import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { errorHandler, notFound } from './middleware/errorHandler';
import { syncDatabase, testDatabaseConnection } from './config/database';
import { authRouter } from './modules/auth/auth.router';
import { studentRouter } from './modules/student/student.router';
import { teacherRouter } from './modules/teacher/teacher.router';
import { adminRouter } from './modules/admin/admin.router';
import { setupRouter } from './modules/setup/setup.router';
// Import new models for registration
import './models/TeacherSubjectAssignment';
import './models/ClassTeacherAssignment';
import { getSchoolProfile, getDashboardSummary } from './modules/admin/admin.service';
import { authenticateToken } from './modules/auth/auth.controller';
import jwt from 'jsonwebtoken';
import { HttpError } from './middleware/errorHandler';

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      
      if (env.nodeEnv === 'development') {
        const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
        const isLocalNetwork = /^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)/.test(origin);
        if (isLocalhost || isLocalNetwork) {
          return callback(null, true);
        }
      }
      
      if (env.corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Public school profile endpoint (no auth required)
app.get('/api/school/profile', async (_req, res, next) => {
  try {
    const profile = await getSchoolProfile();
    res.json(profile);
  } catch (error) {
    next(error);
  }
});

// Shared dashboard summary endpoint - accessible by all authenticated roles
app.get('/api/dashboard/summary', authenticateToken, async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      throw new HttpError(401, 'Authentication required');
    }
    
    const decoded = jwt.verify(token, env.jwtSecret) as unknown as { sub: number; role: string; email: string };
    const role = decoded.role;
    
    if (!role || !['admin', 'teacher', 'student'].includes(role)) {
      throw new HttpError(403, 'Unauthorized access');
    }
    
    const summary = await getDashboardSummary(role);
    res.json(summary);
  } catch (error) {
    next(error);
  }
});

// Routers
app.use('/api/auth', authRouter);
app.use('/api/setup', setupRouter);
app.use('/api/students', studentRouter);
app.use('/api/teachers', teacherRouter);
app.use('/api/admin', adminRouter);

app.use(notFound);
app.use(errorHandler);

async function start() {
  try {
    await testDatabaseConnection();
    await syncDatabase();
    app.listen(env.port, '127.0.0.1', () => {
      console.log(`Backend listening on http://localhost:${env.port}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

void start();
