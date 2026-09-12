const { db, auth } = require('../config/firebase');
const bcrypt = require('bcryptjs');

/* ---------------------------------------
   REGISTER USER
--------------------------------------- */
const registerUser = async (req, res) => {
  try {
    const { uid, name, email, username, role } = req.body;

    /* -------- Validation -------- */
    if (!uid || !name || !email || !username || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const allowedRoles = ['employee', 'owner'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    /* -------- Check Username Uniqueness -------- */
    const usernameSnapshot = await db
      .collection('users')
      .where('username', '==', username)
      .limit(1)
      .get();

    if (!usernameSnapshot.empty) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    /* -------- Save Firestore Profile (UID as doc ID) -------- */
    await db.collection('users').doc(uid).set({
      name,
      email,
      username,
      role,
      createdAt: new Date().toISOString()
    }, { merge: true });

    return res.status(201).json({
      message: 'User profile created successfully'
    });

  } catch (error) {
    console.error('Signup Error:', error);
    return res.status(500).json({ message: 'Server error during signup' });
  }
};


/* ---------------------------------------
   LOGIN USER
--------------------------------------- */
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: 'Email and password are required'
            });
        }

        /*
          IMPORTANT:
          Backend DOES NOT verify password with Firebase Admin.
          Password verification happens on FRONTEND using Firebase SDK.
        */

        return res.status(200).json({
            message:
                'Use Firebase client SDK to sign in and send ID token to backend'
        });

    } catch (error) {
        console.error('Login Error:', error);
        return res.status(500).json({ message: 'Server error during login' });
    }
};


const resolveusername = async (req, res) => {
    try {
        const { username } = req.body;

        if (!username) {
            return res.status(400).json({ message: 'Username is required' });
        }

        const snapshot = await db
            .collection('users')
            .where('username', '==', username)
            .limit(1)
            .get();

        if (snapshot.empty) {
            return res.status(404).json({ message: 'User not found' });
        }

        const userData = snapshot.docs[0].data();

        return res.status(200).json({
            email: userData.email,
            role: userData.role
        });

    } catch (error) {
        console.error('Resolve Username Error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { registerUser, loginUser, resolveusername };
