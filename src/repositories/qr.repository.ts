import { FirestoreRest } from '../utils/firestoreRest';
import type { Bindings } from '../types';
import { QRCard, QRCardCreate, QRCardUpdate } from '../interfaces/qr.interface';

const COLLECTION = 'qr_cards';

let _db: FirestoreRest | null = null;

export function initDb(env: Bindings): void {
  if (_db) return;
  _db = new FirestoreRest(env.FIREBASE_PROJECT_ID, env.FIREBASE_CLIENT_EMAIL, env.FIREBASE_PRIVATE_KEY);
}

function getDb(): FirestoreRest {
  if (!_db) throw new Error('Firestore not initialized');
  return _db;
}

export const qrRepository = {
  async create(data: QRCardCreate): Promise<QRCard> {
    const db = getDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const card: QRCard = { ...data, id, created_at: now, updated_at: now };
    await db.set(COLLECTION, id, card as unknown as Record<string, unknown>);
    return card;
  },

  async findAll(): Promise<QRCard[]> {
    const db = getDb();
    const rows = await db.runQuery({
      from: [{ collectionId: COLLECTION }],
      orderBy: [{ field: { fieldPath: 'created_at' }, direction: 'DESCENDING' }],
    });
    return rows as unknown as QRCard[];
  },

  async findById(id: string): Promise<QRCard | null> {
    const db = getDb();
    return (await db.get(COLLECTION, id)) as QRCard | null;
  },

  async findBySlug(slug: string): Promise<QRCard | null> {
    const db = getDb();
    const rows = await db.runQuery({
      from: [{ collectionId: COLLECTION }],
      where: {
        fieldFilter: {
          field: { fieldPath: 'qr_slug' },
          op: 'EQUAL',
          value: { stringValue: slug },
        },
      },
      limit: 1,
    });
    return rows.length > 0 ? (rows[0] as unknown as QRCard) : null;
  },

  async update(id: string, data: QRCardUpdate): Promise<QRCard | null> {
    const db = getDb();
    await db.update(COLLECTION, id, { ...(data as Record<string, unknown>), updated_at: new Date().toISOString() });
    return (await db.get(COLLECTION, id)) as QRCard | null;
  },

  async updateStatus(id: string, enabled: boolean): Promise<QRCard | null> {
    const db = getDb();
    await db.update(COLLECTION, id, { enabled, updated_at: new Date().toISOString() });
    return (await db.get(COLLECTION, id)) as QRCard | null;
  },

  async delete(id: string): Promise<void> {
    await getDb().delete(COLLECTION, id);
  },
};
