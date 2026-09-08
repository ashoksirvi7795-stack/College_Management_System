const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/', verifyToken, examController.getAllExaminations);
router.get('/:id', verifyToken, examController.getExaminationById);
router.post('/', verifyToken, requireRole('ADMIN', 'FACULTY'), examController.createExamination);
router.put('/:id', verifyToken, requireRole('ADMIN', 'FACULTY'), examController.updateExamination);
router.delete('/:id', verifyToken, requireRole('ADMIN'), examController.deleteExamination);

module.exports = router;
