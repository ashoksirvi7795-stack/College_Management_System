const db = require('../config/db');

/**
 * Get all departments
 */
async function getAllDepartments(req, res, next) {
    try {
        const departments = await db.query('SELECT * FROM departments ORDER BY department_name ASC');
        res.json({
            success: true,
            data: departments
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Create a new department
 */
async function createDepartment(req, res, next) {
    try {
        const { department_name, department_code } = req.body;

        if (!department_name || !department_code) {
            return res.status(400).json({
                success: false,
                message: 'Both department_name and department_code are required'
            });
        }

        const existing = await db.getOne('SELECT id FROM departments WHERE department_code = ?', [department_code.trim().toUpperCase()]);
        if (existing) {
            return res.status(409).json({ success: false, message: 'Department code already exists' });
        }

        const result = await db.execute(
            'INSERT INTO departments (department_name, department_code) VALUES (?, ?)',
            [department_name.trim(), department_code.trim().toUpperCase()]
        );

        const newDept = await db.getOne('SELECT * FROM departments WHERE id = ?', [result.insertId]);

        res.status(201).json({
            success: true,
            message: 'Department created successfully',
            data: newDept
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getAllDepartments,
    createDepartment
};
