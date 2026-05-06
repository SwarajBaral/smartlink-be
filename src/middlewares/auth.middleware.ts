import { type Context, type Next } from 'hono';
import admin from '../config/firebase';
import type { AppEnv } from '../types';

export async function verifyFirebaseToken(c: Context<AppEnv>, next: Next): Promise<Response | void> {
  const authHeader = c.req.header('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ success: false, message: 'Missing or invalid authorization header' }, 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    c.set('user', { uid: decoded.uid, email: decoded.email });
    await next();
  } catch (err) {
    console.error('[Auth] verifyIdToken failed:', (err as Error).message);
    return c.json({ success: false, message: 'Invalid or expired token' }, 401);
  }
}
