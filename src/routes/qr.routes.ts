import { Hono } from 'hono';
import { qrController } from '../controllers/qr.controller';
import { verifyFirebaseToken } from '../middlewares/auth.middleware';
import type { AppEnv } from '../types';

const router = new Hono<AppEnv>();

// Public — no auth required
router.get('/card/:slug', qrController.getPublicBySlug);

// Protected — require valid Firebase token
router.post('/', verifyFirebaseToken, qrController.create);
router.get('/', verifyFirebaseToken, qrController.getAll);
router.get('/:id', verifyFirebaseToken, qrController.getById);
router.put('/:id', verifyFirebaseToken, qrController.update);
router.patch('/:id/status', verifyFirebaseToken, qrController.toggleStatus);
router.delete('/:id', verifyFirebaseToken, qrController.remove);

export default router;
