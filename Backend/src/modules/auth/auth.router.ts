import { Router } from 'express';
import { loginHandler, changePasswordHandler, authenticateToken } from './auth.controller';

export const authRouter = Router();

authRouter.post('/login', loginHandler);
authRouter.post('/change-password', authenticateToken, changePasswordHandler);

