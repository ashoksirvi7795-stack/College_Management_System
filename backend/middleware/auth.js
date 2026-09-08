const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_college_management_jwt_key_2026_change_in_production';

/**
 * Verify JWT Token and attach user & linked entity info
 */
async function verifyToken(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Authentication token is missing or malformed'
            });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);

        const user = await db.getOne(
            'SELECT id, username, email, role FROM users WHERE id = ?',
            [decoded.userId]
        );

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User account not found or deactivated'
            });
        }

        req.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
        };

        // Attach linked Student or Faculty info
        if (user.role === 'STUDENT') {
            const student = await db.getOne(
                'SELECT id, roll_number, first_name, last_name, department, semester FROM students WHERE user_id = ?',
                [user.id]
            );
            if (student) {
                req.user.studentId = student.id;
                req.user.roll_number = student.roll_number;
                req.user.firstName = student.first_name;
                req.user.lastName = student.last_name;
                req.user.department = student.department;
            }
        } else if (user.role === 'FACULTY') {
            const faculty = await db.getOne(
                'SELECT id, employee_id, first_name, last_name, department, designation FROM faculty WHERE user_id = ?',
                [user.id]
            );
            if (faculty) {
                req.user.facultyId = faculty.id;
                req.user.employeeId = faculty.employee_id;
                req.user.firstName = faculty.first_name;
                req.user.lastName = faculty.last_name;
                req.user.department = faculty.department;
            }
        }

        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Session has expired, please log in again'
            });
        }
        return res.status(401).json({
            success: false,
            message: 'Invalid authorization token'
        });
    }
}

/**
 * Role-Based Access Control (RBAC) middleware
 */
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Requires one of: [${allowedRoles.join(', ')}]`
            });
        }

        next();
    };
}

module.exports = {
    verifyToken,
    requireRole
};
