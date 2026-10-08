const express = require('express');
const { db } = require('../config/firebase');
const router = express.Router();
const { registerUser, loginUser, resolveusername } = require('../controllers/authController');
const verifyFirebaseToken = require('../middleware/auth.middleware');


router.post('/signup', registerUser);
router.post('/login', loginUser);

router.post('/resolve-username', resolveusername);


router.get('/me', verifyFirebaseToken, async (req, res) => {
  // Guard: Firestore may be unavailable if Firebase failed to initialize
  if (!db) {
    return res.status(503).json({ message: 'Database service unavailable. Check server configuration.' });
  }

  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();

    // Guard: User authenticated via Firebase but has no Firestore profile
    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User profile not found. Please contact an administrator.' });
    }

    const userData = userDoc.data();

    return res.status(200).json({
      message: 'Authenticated',
      user: {
        uid: req.user.uid,
        email: req.user.email,
        username: userData?.username || req.user.name || req.user.email?.split('@')[0] || '',
        role: userData?.role || 'employee'
      }
    });

  } catch (error) {
    console.error('ME route error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;
