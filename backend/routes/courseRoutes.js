const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/', verifyToken, courseController.getAllCourses);
router.get('/:id', verifyToken, courseController.getCourseById);
router.post('/', verifyToken, requireRole('ADMIN'), courseController.createCourse);
router.put('/:id', verifyToken, requireRole('ADMIN'), courseController.updateCourse);
router.delete('/:id', verifyToken, requireRole('ADMIN'), courseController.deleteCourse);
router.post('/:id/enroll', verifyToken, requireRole('ADMIN'), courseController.enrollStudent);
router.delete('/:id/enroll/:studentId', verifyToken, requireRole('ADMIN'), courseController.unenrollStudent);

module.exports = router;
