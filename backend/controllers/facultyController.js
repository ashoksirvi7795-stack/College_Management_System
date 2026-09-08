const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { isValidEmail, isValidPhone } = require('../utils/helpers');

/**
 * Get all faculty members with search and department filter
 */
async function getAllFaculty(req, res, next) {
    try {
        const { q, department, page = 1, limit = 10 } = req.query;

        const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
        const params = [];
        const countParams = [];
        let whereClauses = [];

        if (q && q.trim()) {
            const searchTerm = `%${q.trim()}%`;
            whereClauses.push('(f.first_name LIKE ? OR f.last_name LIKE ? OR f.employee_id LIKE ? OR f.email LIKE ?)');
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
            countParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        if (department && department.trim()) {
            whereClauses.push('f.department = ?');
            params.push(department.trim());
            countParams.push(department.trim());
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        const countRow = await db.getOne(`SELECT COUNT(*) as total FROM faculty f ${whereSql}`, countParams);
        const total = parseInt(countRow?.total || 0, 10);

        params.push(parseInt(limit, 10), offset);
        const facultyList = await db.query(`
            SELECT f.*, u.username, COUNT(c.id) as assigned_courses_count
            FROM faculty f
            LEFT JOIN users u ON f.user_id = u.id
            LEFT JOIN courses c ON f.id = c.faculty_id
            ${whereSql}
            GROUP BY f.id
            ORDER BY f.id DESC
            LIMIT ? OFFSET ?
        `, params);

        res.json({
            success: true,
            data: facultyList,
            pagination: {
                total,
                page: parseInt(page, 10),
                limit: parseInt(limit, 10),
                totalPages: Math.ceil(total / parseInt(limit, 10))
            }
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Get faculty by ID with assigned courses and students
 */
async function getFacultyById(req, res, next) {
    try {
        const { id } = req.params;

        const faculty = await db.getOne(`
            SELECT f.*, u.username
            FROM faculty f
            LEFT JOIN users u ON f.user_id = u.id
            WHERE f.id = ?
        `, [id]);

        if (!faculty) {
            return res.status(404).json({ success: false, message: 'Faculty member not found' });
        }

        // Assigned courses
        const courses = await db.query(`
            SELECT c.*, COUNT(sc.student_id) as enrolled_students_count
            FROM courses c
            LEFT JOIN student_courses sc ON c.id = sc.course_id
            WHERE c.faculty_id = ?
            GROUP BY c.id
        `, [id]);

        res.json({
            success: true,
            data: {
                faculty,
                courses
            }
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Create a new faculty member
 */
async function createFaculty(req, res, next) {
    try {
        const {
            employee_id, first_name, last_name, email,
            phone, department, designation, joining_date,
            username, password
        } = req.body;

        if (!employee_id || !first_name || !last_name || !email || !department || !designation) {
            return res.status(400).json({
                success: false,
                message: 'Required fields: employee_id, first_name, last_name, email, department, designation'
            });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({ success: false, message: 'Invalid email address format' });
        }

        if (phone && !isValidPhone(phone)) {
            return res.status(400).json({ success: false, message: 'Invalid phone number format' });
        }

        // Check uniqueness
        const existing = await db.getOne(
            'SELECT id FROM faculty WHERE employee_id = ? OR email = ?',
            [employee_id.trim(), email.trim().toLowerCase()]
        );
        if (existing) {
            return res.status(409).json({
                success: false,
                message: 'A faculty member with this employee ID or email already exists'
            });
        }

        const facultyUsername = username ? username.trim() : employee_id.trim().toLowerCase();
        const facultyPassword = password || 'Faculty@123';

        const existingUser = await db.getOne('SELECT id FROM users WHERE username = ? OR email = ?', [facultyUsername, email.trim().toLowerCase()]);
        if (existingUser) {
            return res.status(409).json({ success: false, message: 'User account with this username or email already exists' });
        }

        const passwordHash = await bcrypt.hash(facultyPassword, 10);

        const result = await db.withTransaction(async (tx) => {
            const userRes = await tx.execute(
                'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
                [facultyUsername, email.trim().toLowerCase(), passwordHash, 'FACULTY']
            );
            const userId = userRes.insertId;

            const facRes = await tx.execute(`
                INSERT INTO faculty (
                    user_id, employee_id, first_name, last_name, email, phone,
                    department, designation, joining_date
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                userId,
                employee_id.trim().toUpperCase(),
                first_name.trim(),
                last_name.trim(),
                email.trim().toLowerCase(),
                phone ? phone.trim() : null,
                department.trim(),
                designation.trim(),
                joining_date || new Date().toISOString().split('T')[0]
            ]);

            return { facultyId: facRes.insertId, userId };
        });

        const newFaculty = await db.getOne('SELECT * FROM faculty WHERE id = ?', [result.facultyId]);

        res.status(201).json({
            success: true,
            message: 'Faculty member created successfully',
            data: newFaculty
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Update faculty details
 */
async function updateFaculty(req, res, next) {
    try {
        const { id } = req.params;
        const { first_name, last_name, phone, department, designation, joining_date } = req.body;

        const existing = await db.getOne('SELECT * FROM faculty WHERE id = ?', [id]);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Faculty member not found' });
        }

        if (phone && !isValidPhone(phone)) {
            return res.status(400).json({ success: false, message: 'Invalid phone number format' });
        }

        await db.execute(`
            UPDATE faculty SET
                first_name = COALESCE(?, first_name),
                last_name = COALESCE(?, last_name),
                phone = COALESCE(?, phone),
                department = COALESCE(?, department),
                designation = COALESCE(?, designation),
                joining_date = COALESCE(?, joining_date)
            WHERE id = ?
        `, [
            first_name ? first_name.trim() : null,
            last_name ? last_name.trim() : null,
            phone ? phone.trim() : null,
            department ? department.trim() : null,
            designation ? designation.trim() : null,
            joining_date || null,
            id
        ]);

        const updated = await db.getOne('SELECT * FROM faculty WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Faculty details updated successfully',
            data: updated
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Delete faculty member
 */
async function deleteFaculty(req, res, next) {
    try {
        const { id } = req.params;
        const faculty = await db.getOne('SELECT * FROM faculty WHERE id = ?', [id]);
        if (!faculty) {
            return res.status(404).json({ success: false, message: 'Faculty member not found' });
        }

        await db.withTransaction(async (tx) => {
            await tx.execute('DELETE FROM faculty WHERE id = ?', [id]);
            if (faculty.user_id) {
                await tx.execute('DELETE FROM users WHERE id = ?', [faculty.user_id]);
            }
        });

        res.json({
            success: true,
            message: 'Faculty member and account deleted successfully'
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getAllFaculty,
    getFacultyById,
    createFaculty,
    updateFaculty,
    deleteFaculty
};
