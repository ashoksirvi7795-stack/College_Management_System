const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/', verifyToken, departmentController.getAllDepartments);
router.post('/', verifyToken, requireRole('ADMIN'), departmentController.createDepartment);

module.exports = router;
