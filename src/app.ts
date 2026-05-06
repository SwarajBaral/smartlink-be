import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { initDb } from './repositories/qr.repository';
import qrRoutes from './routes/qr.routes';
import authRoutes from './routes/auth.routes';
import type { AppEnv } from './types';

const app = new Hono<AppEnv>();

app.use('*', secureHeaders());

app.use('*', async (c, next) => {
  const allowed = [c.env.FRONTEND_URL ?? 'http://localhost:5173', 'http://localhost:5173'];
  return cors({
    origin: (origin) => {
      if (!origin) return null;
      if (
        allowed.includes(origin) ||
        origin.endsWith('.ngrok-free.app') ||
        origin.endsWith('.ngrok.io')
      ) {
        return origin;
      }
      return null;
    },
    credentials: true,
  })(c, next);
});

// Initialize Firebase once per isolate on the first request
app.use('*', async (c, next) => {
  initDb(c.env);
  await next();
});

app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.route('/api/v1/auth', authRoutes);
app.route('/api/v1/qr', qrRoutes);

app.onError((err, c) => {
  console.error('[Error]', err.message);
  return c.json({ success: false, message: err.message || 'Internal server error' }, 500);
});

app.notFound((c) => c.json({ success: false, message: 'Not found' }, 404));

export default app;
