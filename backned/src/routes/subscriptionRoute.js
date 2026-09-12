const express = require('express');
const router = express.Router();
const {
    createSubscription,
    getSubscriptions,
    deleteSubscription
} = require('../controllers/subscriptionController');

// Routes
router.post('/subscriptions', createSubscription);
router.get('/subscriptions', getSubscriptions);
router.delete('/subscriptions/:id', deleteSubscription);

module.exports = router;