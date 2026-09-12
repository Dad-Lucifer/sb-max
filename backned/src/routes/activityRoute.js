const express = require('express');
const router = express.Router();

const { getPlayerActivity } = require('../controllers/playerActivityController');

router.get('/player-activity', getPlayerActivity);

module.exports = router;