const { auth, db } = require('../config/firebase');

const verifyFirebaseToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Authorization token missing' });
        }

        const token = authHeader.split(' ')[1];

        const decodedToken = await auth.verifyIdToken(token);

        // Revoke access: block any further action for revoked users
        const userDoc = await db.collection('users').doc(decodedToken.uid).get();
        if (userDoc.exists && userDoc.data().role === 'revoked') {
            return res.status(403).json({ message: 'Access denied. Your access has been revoked.' });
        }

        req.user = decodedToken;
        next();

    } catch (error) {
        console.error('Auth Middleware Error:', error);
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

module.exports = verifyFirebaseToken;
