const express = require('express');
const router = express.Router();
const facultyController = require('../controllers/facultyController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/', verifyToken, requireRole('ADMIN'), facultyController.getAllFaculty);
router.get('/:id', verifyToken, requireRole('ADMIN', 'FACULTY'), facultyController.getFacultyById);
router.post('/', verifyToken, requireRole('ADMIN'), facultyController.createFaculty);
router.put('/:id', verifyToken, requireRole('ADMIN'), facultyController.updateFaculty);
router.delete('/:id', verifyToken, requireRole('ADMIN'), facultyController.deleteFaculty);

module.exports = router;
