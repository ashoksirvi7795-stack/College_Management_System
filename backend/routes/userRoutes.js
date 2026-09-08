const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/', verifyToken, requireRole('ADMIN'), userController.getAllUsers);
router.post('/', verifyToken, requireRole('ADMIN'), userController.createUser);
router.put('/:id/role', verifyToken, requireRole('ADMIN'), userController.updateUserRole);
router.put('/:id/reset-password', verifyToken, requireRole('ADMIN'), userController.resetPassword);
router.delete('/:id', verifyToken, requireRole('ADMIN'), userController.deleteUser);

module.exports = router;
