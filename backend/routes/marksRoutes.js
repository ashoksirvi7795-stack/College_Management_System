const express = require('express');
const router = express.Router();
const marksController = require('../controllers/marksController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/', verifyToken, marksController.getMarks);
router.post('/', verifyToken, requireRole('ADMIN', 'FACULTY'), marksController.recordMarks);
router.put('/:id', verifyToken, requireRole('ADMIN', 'FACULTY'), marksController.updateMarkById);
router.delete('/:id', verifyToken, requireRole('ADMIN'), marksController.deleteMark);

module.exports = router;
