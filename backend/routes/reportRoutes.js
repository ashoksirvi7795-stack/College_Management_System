const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/students', verifyToken, requireRole('ADMIN'), reportController.getStudentReport);
router.get('/faculty', verifyToken, requireRole('ADMIN'), reportController.getFacultyReport);
router.get('/attendance', verifyToken, requireRole('ADMIN', 'FACULTY'), reportController.getAttendanceReport);
router.get('/marks', verifyToken, requireRole('ADMIN', 'FACULTY'), reportController.getMarksReport);
router.get('/fees', verifyToken, requireRole('ADMIN'), reportController.getFeeReport);
router.get('/courses', verifyToken, requireRole('ADMIN', 'FACULTY'), reportController.getCourseReport);

module.exports = router;
