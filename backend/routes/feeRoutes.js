const express = require('express');
const router = express.Router();
const feeController = require('../controllers/feeController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/', verifyToken, feeController.getAllFees);
router.get('/:id', verifyToken, feeController.getFeeById);
router.post('/', verifyToken, requireRole('ADMIN'), feeController.createFee);
router.put('/:id', verifyToken, requireRole('ADMIN'), feeController.updateFee);
router.delete('/:id', verifyToken, requireRole('ADMIN'), feeController.deleteFee);

module.exports = router;
