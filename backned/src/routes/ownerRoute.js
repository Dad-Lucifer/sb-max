const express = require('express');
const router = express.Router();
const {
    getOwnerDashboardStats,
    getRevenueFlow,
    getRecentTransactions,
    getRevenueByMachine,
    getDeletionLogs
} = require('../controllers/ownerDashboardController');

router.get('/ownerstat', getOwnerDashboardStats);
router.get('/revenueflow', getRevenueFlow);
router.get('/transactions', getRecentTransactions);
router.get('/revenue-by-machine', getRevenueByMachine);
router.get('/logs', getDeletionLogs);

module.exports = router;