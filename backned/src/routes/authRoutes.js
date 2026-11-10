const express = require('express');
const { db } = require('../config/firebase');
const { getUserProfile } = require('../services/dataCache');
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
    const userData = req.userProfile || await getUserProfile(req.user.uid);

    // Guard: User authenticated via Firebase but has no Firestore profile
    if (!userData) {
      return res.status(404).json({ message: 'User profile not found. Please contact an administrator.' });
    }

    return res.status(200).json({
      message: 'Authenticated',
      user: {
        uid: req.user.uid,
        email: req.user.email,
        username: userData.username || req.user.name || req.user.email?.split('@')[0] || '',
        role: userData.role || 'employee'
      }
    });

  } catch (error) {
    console.error('ME route error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;
