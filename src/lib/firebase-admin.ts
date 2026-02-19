import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let app: App | null = null;
let db: Firestore | null = null;

const getApp = () => {
  if (!app) {
    if (!getApps().length) {
      app = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
    } else {
      app = getApps()[0];
    }
  }
  return app;
};

export const getAdminDb = () => {
  if (!db) {
    db = getFirestore(getApp());
  }
  return db;
};

export const adminDb = {
  collection: (path: string) => getAdminDb().collection(path),
};
