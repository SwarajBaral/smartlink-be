import type { Context } from 'hono';
import { ZodError } from 'zod';
import { qrService } from '../services/qr.service';
import { CreateQRSchema, UpdateQRSchema } from '../validators/qr.validator';
import type { AppEnv } from '../types';

export const qrController = {
  async create(c: Context<AppEnv>): Promise<Response> {
    try {
      const body = await c.req.json();
      const parsed = CreateQRSchema.parse(body);
      const card = await qrService.createQR(parsed, c.env.PUBLIC_BASE_URL ?? 'http://localhost:5173');
      return c.json({ success: true, message: 'QR created successfully', data: card }, 201);
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json({ success: false, message: 'Validation error', errors: err.errors }, 400);
      }
      throw err;
    }
  },

  async getAll(c: Context<AppEnv>): Promise<Response> {
    const cards = await qrService.getAllQRs();
    return c.json({ success: true, message: 'OK', data: cards });
  },

  async getById(c: Context<AppEnv>): Promise<Response> {
    const card = await qrService.getQRById(c.req.param('id'));
    if (!card) {
      return c.json({ success: false, message: 'QR card not found' }, 404);
    }
    return c.json({ success: true, message: 'OK', data: card });
  },

  async getPublicBySlug(c: Context<AppEnv>): Promise<Response> {
    const data = await qrService.getPublicCardBySlug(c.req.param('slug'));
    return c.json({ success: true, message: 'OK', data });
  },

  async update(c: Context<AppEnv>): Promise<Response> {
    try {
      const body = await c.req.json();
      const parsed = UpdateQRSchema.parse(body);
      const card = await qrService.updateQR(c.req.param('id'), parsed);
      return c.json({ success: true, message: 'QR updated successfully', data: card });
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json({ success: false, message: 'Validation error', errors: err.errors }, 400);
      }
      if ((err as Error).message === 'QR card not found') {
        return c.json({ success: false, message: 'QR card not found' }, 404);
      }
      throw err;
    }
  },

  async toggleStatus(c: Context<AppEnv>): Promise<Response> {
    try {
      const card = await qrService.toggleStatus(c.req.param('id'));
      return c.json({
        success: true,
        message: `QR ${card.enabled ? 'enabled' : 'disabled'} successfully`,
        data: card,
      });
    } catch (err) {
      if ((err as Error).message === 'QR card not found') {
        return c.json({ success: false, message: 'QR card not found' }, 404);
      }
      throw err;
    }
  },

  async remove(c: Context<AppEnv>): Promise<Response> {
    try {
      await qrService.deleteQR(c.req.param('id'));
      return c.json({ success: true, message: 'QR deleted successfully' });
    } catch (err) {
      if ((err as Error).message === 'QR card not found') {
        return c.json({ success: false, message: 'QR card not found' }, 404);
      }
      throw err;
    }
  },
};
