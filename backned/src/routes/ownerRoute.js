const express = require('express');
const router = express.Router();
const {
    getOwnerDashboardStats,
    getRevenueFlow,
    getRecentTransactions,
    getRevenueByMachine,
    getDeletionLogs,
    getTransactionDetail,
    getMonthStats,
    getMonthRevenueFlow,
    getMonthTransactions,
    getMonthRevenueByMachine,
    getMonthDeletionLogs
} = require('../controllers/ownerDashboardController');

// Existing time-range routes
router.get('/ownerstat', getOwnerDashboardStats);
router.get('/revenueflow', getRevenueFlow);
router.get('/transactions', getRecentTransactions);
router.get('/transaction/:id', getTransactionDetail);
router.get('/revenue-by-machine', getRevenueByMachine);
router.get('/logs', getDeletionLogs);

// New month-based routes (month=YYYY-MM)
router.get('/month/stats', getMonthStats);
router.get('/month/revenueflow', getMonthRevenueFlow);
router.get('/month/transactions', getMonthTransactions);
router.get('/month/revenue-by-machine', getMonthRevenueByMachine);
router.get('/month/logs', getMonthDeletionLogs);

module.exports = router;
