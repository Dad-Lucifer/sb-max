const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config();

try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        if (serviceAccount.private_key) {
            serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        }
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('Firebase initialized with ENV variables');
    } else {
        console.warn('WARNING: FIREBASE_SERVICE_ACCOUNT env not found. Database calls will fail until configured.');
    }
} catch (error) {
    console.error('Firebase initialization error:', error);
}

// Both db and auth are guarded — they are null if Firebase failed to initialize.
// Downstream middleware and routes must check for null before using them.
let db = null;
let auth = null;

try {
    if (admin.apps.length > 0) {
        db = admin.firestore();
        auth = admin.auth(); // Only call this after confirmed initialization
    }
} catch (e) {
    console.error('Error initializing Firebase services (Firestore/Auth):', e);
}

module.exports = { admin, db, auth };
