const express = require('express');
const router = express.Router(); // Wait, router = express.Router();
// Correct syntax:
const { getSnacks, addSnack, deductStock, deleteSnack } = require('../controllers/snackController');

router.get('/', getSnacks);
router.post('/', addSnack); // Handles adding stock
router.post('/deduct', deductStock); // Handles deducting stock
router.delete('/:id', deleteSnack);

module.exports = router;
