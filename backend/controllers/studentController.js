const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { isValidEmail, isValidPhone, calculateAttendancePercentage } = require('../utils/helpers');

/**
 * Get all students with search, filters, and pagination
 */
async function getAllStudents(req, res, next) {
    try {
        const { q, department, year, semester, page = 1, limit = 10 } = req.query;

        const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
        const params = [];
        const countParams = [];
        let whereClauses = [];

        if (q && q.trim()) {
            const searchTerm = `%${q.trim()}%`;
            whereClauses.push('(s.first_name LIKE ? OR s.last_name LIKE ? OR s.roll_number LIKE ? OR s.email LIKE ?)');
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
            countParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        if (department && department.trim()) {
            whereClauses.push('s.department = ?');
            params.push(department.trim());
            countParams.push(department.trim());
        }

        if (year) {
            whereClauses.push('s.year = ?');
            params.push(parseInt(year, 10));
            countParams.push(parseInt(year, 10));
        }

        if (semester) {
            whereClauses.push('s.semester = ?');
            params.push(parseInt(semester, 10));
            countParams.push(parseInt(semester, 10));
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // Total count
        const countRow = await db.getOne(`SELECT COUNT(*) as total FROM students s ${whereSql}`, countParams);
        const total = parseInt(countRow?.total || 0, 10);

        // Fetch students with limit and offset
        params.push(parseInt(limit, 10), offset);
        const students = await db.query(`
            SELECT s.*, u.username
            FROM students s
            LEFT JOIN users u ON s.user_id = u.id
            ${whereSql}
            ORDER BY s.id DESC
            LIMIT ? OFFSET ?
        `, params);

        res.json({
            success: true,
            data: students,
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
 * Get student by ID with enrolled courses, attendance summary, marks, and fees
 */
async function getStudentById(req, res, next) {
    try {
        const { id } = req.params;

        // If STUDENT role, verify they are accessing only their own profile
        if (req.user.role === 'STUDENT' && req.user.studentId !== parseInt(id, 10)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only view your own student profile.'
            });
        }

        const student = await db.getOne(`
            SELECT s.*, u.username
            FROM students s
            LEFT JOIN users u ON s.user_id = u.id
            WHERE s.id = ?
        `, [id]);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // 1. Enrolled Courses
        const courses = await db.query(`
            SELECT c.*, sc.enrollment_date, f.first_name as faculty_first_name, f.last_name as faculty_last_name
            FROM student_courses sc
            JOIN courses c ON sc.course_id = c.id
            LEFT JOIN faculty f ON c.faculty_id = f.id
            WHERE sc.student_id = ?
        `, [id]);

        // 2. Attendance Summary
        const attendanceSummary = await db.query(`
            SELECT c.id as course_id, c.course_code, c.course_name,
                   COUNT(a.id) as total_classes,
                   SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) as present_count,
                   SUM(CASE WHEN a.status = 'ABSENT' THEN 1 ELSE 0 END) as absent_count,
                   SUM(CASE WHEN a.status = 'LATE' THEN 1 ELSE 0 END) as late_count
            FROM student_courses sc
            JOIN courses c ON sc.course_id = c.id
            LEFT JOIN attendance a ON a.course_id = c.id AND a.student_id = ?
            WHERE sc.student_id = ?
            GROUP BY c.id
        `, [id, id]);

        const formattedAttendance = attendanceSummary.map(item => ({
            ...item,
            attendance_percentage: calculateAttendancePercentage(item.present_count, item.total_classes)
        }));

        // 3. Marks
        const marks = await db.query(`
            SELECT m.*, e.exam_name, e.exam_type, e.exam_date, c.course_code, c.course_name
            FROM marks m
            JOIN examinations e ON m.examination_id = e.id
            JOIN courses c ON e.course_id = c.id
            WHERE m.student_id = ?
            ORDER BY e.exam_date DESC
        `, [id]);

        // 4. Fees and Payments
        const fees = await db.query(`
            SELECT f.*,
                   COALESCE(SUM(p.amount_paid), 0) as paid_amount,
                   (f.amount - COALESCE(SUM(p.amount_paid), 0)) as remaining_amount
            FROM fees f
            LEFT JOIN payments p ON f.id = p.fee_id AND p.status = 'SUCCESS'
            WHERE f.student_id = ?
            GROUP BY f.id
            ORDER BY f.due_date ASC
        `, [id]);

        res.json({
            success: true,
            data: {
                student,
                courses,
                attendance: formattedAttendance,
                marks,
                fees
            }
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Create a new student
 */
async function createStudent(req, res, next) {
    try {
        const {
            roll_number, first_name, last_name, email,
            phone, date_of_birth, gender, address,
            department, year, semester, admission_date,
            username, password
        } = req.body;

        // Validation
        if (!roll_number || !first_name || !last_name || !email || !department || !year || !semester) {
            return res.status(400).json({
                success: false,
                message: 'Required fields: roll_number, first_name, last_name, email, department, year, semester'
            });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({ success: false, message: 'Invalid email address format' });
        }

        if (phone && !isValidPhone(phone)) {
            return res.status(400).json({ success: false, message: 'Invalid phone number format' });
        }

        // Check uniqueness of roll_number and email
        const existingStudent = await db.getOne(
            'SELECT id FROM students WHERE roll_number = ? OR email = ?',
            [roll_number.trim(), email.trim().toLowerCase()]
        );
        if (existingStudent) {
            return res.status(409).json({
                success: false,
                message: 'A student with this roll number or email already exists'
            });
        }

        const studentUsername = username ? username.trim() : roll_number.trim().toLowerCase();
        const studentPassword = password || 'Student@123';

        // Check uniqueness of username
        const existingUser = await db.getOne('SELECT id FROM users WHERE username = ? OR email = ?', [studentUsername, email.trim().toLowerCase()]);
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Username or user account with this email already exists'
            });
        }

        const passwordHash = await bcrypt.hash(studentPassword, 10);

        const result = await db.withTransaction(async (tx) => {
            // Create user account
            const userRes = await tx.execute(
                'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
                [studentUsername, email.trim().toLowerCase(), passwordHash, 'STUDENT']
            );
            const userId = userRes.insertId;

            // Create student record
            const studentRes = await tx.execute(`
                INSERT INTO students (
                    user_id, roll_number, first_name, last_name, date_of_birth,
                    gender, phone, email, address, department, year, semester, admission_date
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                userId,
                roll_number.trim().toUpperCase(),
                first_name.trim(),
                last_name.trim(),
                date_of_birth || null,
                gender || 'Other',
                phone ? phone.trim() : null,
                email.trim().toLowerCase(),
                address || null,
                department.trim(),
                parseInt(year, 10),
                parseInt(semester, 10),
                admission_date || new Date().toISOString().split('T')[0]
            ]);

            return { studentId: studentRes.insertId, userId };
        });

        const newStudent = await db.getOne('SELECT * FROM students WHERE id = ?', [result.studentId]);

        res.status(201).json({
            success: true,
            message: 'Student registered successfully',
            data: newStudent
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Update student details
 */
async function updateStudent(req, res, next) {
    try {
        const { id } = req.params;
        const {
            first_name, last_name, phone, date_of_birth,
            gender, address, department, year, semester
        } = req.body;

        const existing = await db.getOne('SELECT * FROM students WHERE id = ?', [id]);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        if (phone && !isValidPhone(phone)) {
            return res.status(400).json({ success: false, message: 'Invalid phone number format' });
        }

        await db.execute(`
            UPDATE students SET
                first_name = COALESCE(?, first_name),
                last_name = COALESCE(?, last_name),
                phone = COALESCE(?, phone),
                date_of_birth = COALESCE(?, date_of_birth),
                gender = COALESCE(?, gender),
                address = COALESCE(?, address),
                department = COALESCE(?, department),
                year = COALESCE(?, year),
                semester = COALESCE(?, semester)
            WHERE id = ?
        `, [
            first_name ? first_name.trim() : null,
            last_name ? last_name.trim() : null,
            phone ? phone.trim() : null,
            date_of_birth || null,
            gender || null,
            address || null,
            department ? department.trim() : null,
            year ? parseInt(year, 10) : null,
            semester ? parseInt(semester, 10) : null,
            id
        ]);

        const updated = await db.getOne('SELECT * FROM students WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Student updated successfully',
            data: updated
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Delete student and linked user account
 */
async function deleteStudent(req, res, next) {
    try {
        const { id } = req.params;
        const student = await db.getOne('SELECT * FROM students WHERE id = ?', [id]);

        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        await db.withTransaction(async (tx) => {
            // Delete student record (foreign keys cascade to attendance, marks, student_courses, fees)
            await tx.execute('DELETE FROM students WHERE id = ?', [id]);
            if (student.user_id) {
                await tx.execute('DELETE FROM users WHERE id = ?', [student.user_id]);
            }
        });

        res.json({
            success: true,
            message: 'Student and associated account deleted successfully'
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getAllStudents,
    getStudentById,
    createStudent,
    updateStudent,
    deleteStudent
};
