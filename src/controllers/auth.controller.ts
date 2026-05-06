import type { Context } from 'hono';
import type { AppEnv } from '../types';

export const authController = {
  ping: (c: Context<AppEnv>) => c.json({ success: true, message: 'Auth service is running' }),
};
