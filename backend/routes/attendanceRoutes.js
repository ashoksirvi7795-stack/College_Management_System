const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/', verifyToken, attendanceController.getAttendance);
router.post('/', verifyToken, requireRole('ADMIN', 'FACULTY'), attendanceController.markAttendance);
router.get('/summary', verifyToken, attendanceController.getAttendanceSummary);

module.exports = router;
