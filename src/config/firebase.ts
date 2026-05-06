import admin from 'firebase-admin';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import type { Bindings } from '../types';

let _db: Firestore | null = null;

export function initFirebase(env: Bindings): void {
  if (admin.apps.length > 0) return;

  const usingEmulator = env.FIRESTORE_EMULATOR_HOST || env.FIREBASE_AUTH_EMULATOR_HOST;

  admin.initializeApp(
    usingEmulator
      ? { projectId: env.FIREBASE_PROJECT_ID }
      : {
          credential: admin.credential.cert({
            projectId: env.FIREBASE_PROJECT_ID,
            privateKey: env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            clientEmail: env.FIREBASE_CLIENT_EMAIL,
          }),
        }
  );

  _db = getFirestore();
}

export function getDb(): Firestore {
  if (!_db) throw new Error('Firebase not initialized');
  return _db;
}

export default admin;
