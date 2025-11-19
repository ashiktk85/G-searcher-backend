import express from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { AuthMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/login', AuthController.login);
router.get('/profile', AuthMiddleware.authenticate, AuthController.getProfile);

export default router;

