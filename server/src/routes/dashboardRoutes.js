const express = require('express');
const router = express.Router();
const { getUserDashboardStats } = require('../controllers/dashboardController');
const { optionalAuth } = require('../middleware/auth');

router.get('/stats', optionalAuth, getUserDashboardStats);

module.exports = router;
