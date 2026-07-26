const express = require('express');
const router = express.Router();
const { getUserDashboardStats } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

router.get('/stats', protect, getUserDashboardStats);

module.exports = router;
