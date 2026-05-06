import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getDb } from '../config/firebase';
import { QRCard, QRCardCreate, QRCardUpdate } from '../interfaces/qr.interface';

const COLLECTION = 'qr_cards';

export const qrRepository = {
  async create(data: QRCardCreate): Promise<QRCard> {
    const db = getDb();
    const now = Timestamp.now();
    const docRef = db.collection(COLLECTION).doc();
    const card: QRCard = { ...data, id: docRef.id, created_at: now, updated_at: now };
    await docRef.set(card);
    return card;
  },

  async findAll(): Promise<QRCard[]> {
    const db = getDb();
    const snapshot = await db.collection(COLLECTION).orderBy('created_at', 'desc').get();
    return snapshot.docs.map((doc) => doc.data() as QRCard);
  },

  async findById(id: string): Promise<QRCard | null> {
    const db = getDb();
    const doc = await db.collection(COLLECTION).doc(id).get();
    if (!doc.exists) return null;
    return doc.data() as QRCard;
  },

  async findBySlug(slug: string): Promise<QRCard | null> {
    const db = getDb();
    const snapshot = await db
      .collection(COLLECTION)
      .where('qr_slug', '==', slug)
      .limit(1)
      .get();
    if (snapshot.empty) return null;
    return snapshot.docs[0].data() as QRCard;
  },

  async update(id: string, data: QRCardUpdate): Promise<QRCard | null> {
    const db = getDb();
    const ref = db.collection(COLLECTION).doc(id);
    await ref.update({ ...data, updated_at: FieldValue.serverTimestamp() });
    const updated = await ref.get();
    if (!updated.exists) return null;
    return updated.data() as QRCard;
  },

  async updateStatus(id: string, enabled: boolean): Promise<QRCard | null> {
    const db = getDb();
    const ref = db.collection(COLLECTION).doc(id);
    await ref.update({ enabled, updated_at: FieldValue.serverTimestamp() });
    const updated = await ref.get();
    if (!updated.exists) return null;
    return updated.data() as QRCard;
  },

  async delete(id: string): Promise<void> {
    const db = getDb();
    await db.collection(COLLECTION).doc(id).delete();
  },
};
