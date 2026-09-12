const express = require('express');
const router = express.Router();
const {
    createSession,
    getActiveSessions,
    createBooking,
    getUpcomingBookings,
    getDeviceAvailability,
    getDeviceAvailabilityForTime,
    completeSession,
    updateSession,
    deleteSession,
    deleteBooking,
    convertBookingsToSessions,
    exportSessions,
    startBooking,
    createSnackOnlySession
} = require('../controllers/sessionController');

router.get('/export', exportSessions); // Add this before parameterized routes like /:id
router.post('/snack-only', createSnackOnlySession);
router.post('/start', createSession);
router.post('/start-booking/:id', startBooking);
router.get('/active', getActiveSessions);

router.get('/availability', getDeviceAvailability);
router.get('/availability-for-time', getDeviceAvailabilityForTime);

router.post('/update/:id', updateSession);

router.post('/complete/:id', completeSession);
router.delete('/delete/:id', deleteSession);


router.post('/booking', createBooking);
router.get('/upcoming', getUpcomingBookings);
router.delete('/booking/:id', deleteBooking);

// Auto-convert bookings to sessions
router.post('/convert-bookings', convertBookingsToSessions);

module.exports = router;
