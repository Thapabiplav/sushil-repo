import { Router } from 'express';
import { setupHandler, checkSetupStatusHandler } from './setup.controller';

const router = Router();

// Check if system needs setup (no admin user exists)
router.get('/status', checkSetupStatusHandler);

// Setup the system with initial admin user
router.post('/setup', setupHandler);

export { router as setupRouter };
