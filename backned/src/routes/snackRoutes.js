const express = require('express');
const router = express.Router(); // Wait, router = express.Router();
// Correct syntax:
const { getSnacks, addSnack, deductStock, deleteSnack, updateSnack } = require('../controllers/snackController');

router.get('/', getSnacks);
router.post('/', addSnack); // Handles adding stock
router.post('/deduct', deductStock); // Handles deducting stock
router.put('/:id', updateSnack); // Edit an existing snack
router.delete('/:id', deleteSnack);

module.exports = router;
