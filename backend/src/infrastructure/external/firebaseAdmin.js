
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
// Ideally, you would use a service account key file here.
// For now, we will rely on default credentials or potential loose setup if testing locally without service account.
// If you have the JSON file, set GOOGLE_APPLICATION_CREDENTIALS env var.
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault() 
      // Or admin.credential.cert(serviceAccount) if available
    });
    console.log('Firebase Admin Initialized');
  } catch (error) {
    console.warn('Firebase Admin Initialization Warning:', error.message);
  }
}

export const firebaseAdmin = admin;
