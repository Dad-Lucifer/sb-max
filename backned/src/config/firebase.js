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
        // Fallback or placeholder
        console.warn('WARNING: FIREBASE_SERVICE_ACCOUNT env not found. Database calls will fail until configured.');
        // To prevent crash on require, we might not initialize or init default
        // admin.initializeApp(); // This requires ADC or generic setup
    }

} catch (error) {
    console.error('Firebase initialization error:', error);
}

let db = null;
try {
    if (admin.apps.length > 0) {
        db = admin.firestore();
    }
} catch (e) {
    console.error('Error initializing Firestore:', e);
}
const auth = admin.auth();

module.exports = { admin, db, auth };
