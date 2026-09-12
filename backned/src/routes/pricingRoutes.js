const express = require('express');
const router = express.Router();
const { getPricing, updatePricing } = require('../controllers/pricingController');

router.get('/', getPricing);
router.put('/', updatePricing);

module.exports = router;
