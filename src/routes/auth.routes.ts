import { Hono } from 'hono';
import { authController } from '../controllers/auth.controller';
import type { AppEnv } from '../types';

const router = new Hono<AppEnv>();

router.get('/ping', authController.ping);

export default router;
