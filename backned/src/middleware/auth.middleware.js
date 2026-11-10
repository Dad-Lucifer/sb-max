const { auth, db } = require('../config/firebase');
const { getUserProfile, clearUserProfileCache } = require('../services/dataCache');

const verifyFirebaseToken = async (req, res, next) => {
    if (req.method === 'OPTIONS') {
        return next();
    }

    // Guard: Firebase Auth service may be unavailable if env vars are misconfigured
    if (!auth) {
        return res.status(503).json({ message: 'Auth service unavailable. Check server configuration.' });
    }

    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Authorization token missing' });
        }

        const token = authHeader.split(' ')[1];

        const decodedToken = await auth.verifyIdToken(token);

        // Revoke access: block any further action for revoked users
        // Guard: db may be null if Firestore failed to initialize
        if (db) {
            const uid = decodedToken.uid;
            const profile = await getUserProfile(uid);
            if (profile && profile.role === 'revoked') {
                return res.status(403).json({ message: 'Access denied. Your access has been revoked.' });
            }
            req.userProfile = profile;
        }

        req.user = decodedToken;
        next();

    } catch (error) {
        console.error('Auth Middleware Error:', error);
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

module.exports = verifyFirebaseToken;
module.exports.clearRoleCache = (uid) => clearUserProfileCache(uid);
