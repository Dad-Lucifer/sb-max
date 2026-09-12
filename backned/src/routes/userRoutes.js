const express = require('express');
const router = express.Router();
const verifyFirebaseToken = require('../middleware/auth.middleware');
const { getAllUsers, createUser, updateUserRole, deleteUser } = require('../controllers/userController');

// All user routes are protected
router.use(verifyFirebaseToken);

router.get('/', getAllUsers);
router.post('/', createUser);
router.put('/:uid/role', updateUserRole);
router.delete('/:uid', deleteUser);

module.exports = router;
