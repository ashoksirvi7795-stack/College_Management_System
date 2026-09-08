const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/', verifyToken, paymentController.getAllPayments);
router.post('/', verifyToken, requireRole('ADMIN'), paymentController.recordPayment);
router.get('/:id/receipt', verifyToken, paymentController.getPaymentReceipt);

module.exports = router;
