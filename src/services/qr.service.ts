import { qrRepository } from '../repositories/qr.repository';
import { generateSlug } from '../utils/slug';
import { generateQRImage } from '../utils/qrImage';
import { SMARTLINK_DEFAULTS } from '../constants/defaults';
import { CreateQRInput, UpdateQRInput } from '../validators/qr.validator';
import { PublicCardData, QRCard } from '../interfaces/qr.interface';

export const qrService = {
  async createQR(data: CreateQRInput, publicBaseUrl: string): Promise<QRCard> {
    const slug = generateSlug();
    const cardUrl = `${publicBaseUrl}/card/${slug}`;
    const qrImageBase64 = await generateQRImage(cardUrl);

    return qrRepository.create({
      ...data,
      qr_slug: slug,
      qr_image_base64: qrImageBase64,
      enabled: false,
    });
  },

  async getAllQRs(): Promise<QRCard[]> {
    return qrRepository.findAll();
  },

  async getQRById(id: string): Promise<QRCard | null> {
    return qrRepository.findById(id);
  },

  async getPublicCardBySlug(slug: string): Promise<PublicCardData> {
    const card = await qrRepository.findBySlug(slug);

    if (!card || !card.enabled) {
      return {
        qr_slug: slug,
        enabled: false,
        ...SMARTLINK_DEFAULTS,
      };
    }

    const {
      qr_image_base64: _img,
      created_at: _ca,
      updated_at: _ua,
      id: _id,
      ...publicData
    } = card;

    return publicData;
  },

  async updateQR(id: string, data: UpdateQRInput): Promise<QRCard> {
    const existing = await qrRepository.findById(id);
    if (!existing) throw new Error('QR card not found');
    const updated = await qrRepository.update(id, data);
    if (!updated) throw new Error('Failed to update QR card');
    return updated;
  },

  async toggleStatus(id: string): Promise<QRCard> {
    const existing = await qrRepository.findById(id);
    if (!existing) throw new Error('QR card not found');
    const updated = await qrRepository.updateStatus(id, !existing.enabled);
    if (!updated) throw new Error('Failed to update status');
    return updated;
  },

  async deleteQR(id: string): Promise<void> {
    const existing = await qrRepository.findById(id);
    if (!existing) throw new Error('QR card not found');
    await qrRepository.delete(id);
  },
};
