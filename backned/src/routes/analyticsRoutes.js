// routes/analyticsRoutes.js
const express = require('express');
const router = express.Router();
const { getLast24HoursStats, getDeviceOccupancyLast24Hours,
    getPeakHoursLast24Hours,
    getDeviceUsageLast24Hours,
    getSnacksConsumptionLast24Hours,
    getMonthlyGrowthComparison,
    getDashboardData,
 } = require('../controllers/analyticsController');

router.get('/dashboard', getDashboardData);        // ← consolidated (use this)
router.get('/last-24-hours', getLast24HoursStats);
router.get('/deviceoccupancy', getDeviceOccupancyLast24Hours);
router.get('/peakhours',getPeakHoursLast24Hours);
router.get('/deviceusage',getDeviceUsageLast24Hours);
router.get('/snack', getSnacksConsumptionLast24Hours);
router.get('/monthly', getMonthlyGrowthComparison);
module.exports = router;
