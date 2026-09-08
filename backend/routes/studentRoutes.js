const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/', verifyToken, requireRole('ADMIN', 'FACULTY'), studentController.getAllStudents);
router.get('/:id', verifyToken, studentController.getStudentById);
router.post('/', verifyToken, requireRole('ADMIN'), studentController.createStudent);
router.put('/:id', verifyToken, requireRole('ADMIN'), studentController.updateStudent);
router.delete('/:id', verifyToken, requireRole('ADMIN'), studentController.deleteStudent);

module.exports = router;
