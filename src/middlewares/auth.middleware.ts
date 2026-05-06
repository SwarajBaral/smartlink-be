import { type Context, type Next } from 'hono';
import { verifyFirebaseJwt } from '../utils/firebaseAuth';
import type { AppEnv } from '../types';

export async function verifyFirebaseToken(c: Context<AppEnv>, next: Next): Promise<Response | void> {
  const authHeader = c.req.header('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ success: false, message: 'Missing or invalid authorization header' }, 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = await verifyFirebaseJwt(token, c.env.FIREBASE_PROJECT_ID);
    c.set('user', decoded);
    await next();
  } catch (err) {
    console.error('[Auth] verifyIdToken failed:', (err as Error).message);
    return c.json({ success: false, message: 'Invalid or expired token' }, 401);
  }
}
