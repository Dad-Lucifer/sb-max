// Booking Scheduler - Automatically converts bookings to sessions
const { autoConvertBookings } = require('../controllers/sessionController');

let schedulerInterval = null;

// Start the scheduler
const startBookingScheduler = () => {
    if (schedulerInterval) {
        console.log('⚠️ Booking scheduler already running');
        return;
    }

    console.log('🚀 Starting booking auto-conversion scheduler...');

    // Run immediately on startup
    autoConvertBookings();

    // Then run every 30 seconds
    schedulerInterval = setInterval(async () => {
        try {
            const result = await autoConvertBookings();
            if (result && result.converted > 0) {
                console.log(`✨ Auto-converted ${result.converted} booking(s) to sessions`);
            }
        } catch (error) {
            console.error('❌ Scheduler error:', error);
        }
    }, 30000); // Check every 30 seconds

    console.log('✅ Booking scheduler started (checking every 30 seconds)');
};

// Stop the scheduler
const stopBookingScheduler = () => {
    if (schedulerInterval) {
        clearInterval(schedulerInterval);
        schedulerInterval = null;
        console.log('🛑 Booking scheduler stopped');
    }
};

module.exports = {
    startBookingScheduler,
    stopBookingScheduler
};
