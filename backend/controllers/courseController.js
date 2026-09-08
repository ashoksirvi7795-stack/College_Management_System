const db = require('../config/db');

/**
 * Get all courses with filters and enrolled student counts
 */
async function getAllCourses(req, res, next) {
    try {
        const { q, department, semester, faculty_id, page = 1, limit = 10 } = req.query;

        const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
        const params = [];
        const countParams = [];
        let whereClauses = [];

        if (q && q.trim()) {
            const searchTerm = `%${q.trim()}%`;
            whereClauses.push('(c.course_code LIKE ? OR c.course_name LIKE ?)');
            params.push(searchTerm, searchTerm);
            countParams.push(searchTerm, searchTerm);
        }

        if (department && department.trim()) {
            whereClauses.push('c.department = ?');
            params.push(department.trim());
            countParams.push(department.trim());
        }

        if (semester) {
            whereClauses.push('c.semester = ?');
            params.push(parseInt(semester, 10));
            countParams.push(parseInt(semester, 10));
        }

        if (faculty_id) {
            whereClauses.push('c.faculty_id = ?');
            params.push(parseInt(faculty_id, 10));
            countParams.push(parseInt(faculty_id, 10));
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        const countRow = await db.getOne(`SELECT COUNT(*) as total FROM courses c ${whereSql}`, countParams);
        const total = parseInt(countRow?.total || 0, 10);

        params.push(parseInt(limit, 10), offset);
        const courses = await db.query(`
            SELECT c.*,
                   f.first_name as faculty_first_name, f.last_name as faculty_last_name, f.employee_id,
                   COUNT(sc.student_id) as enrolled_students_count
            FROM courses c
            LEFT JOIN faculty f ON c.faculty_id = f.id
            LEFT JOIN student_courses sc ON c.id = sc.course_id
            ${whereSql}
            GROUP BY c.id
            ORDER BY c.id DESC
            LIMIT ? OFFSET ?
        `, params);

        res.json({
            success: true,
            data: courses,
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
 * Get course by ID with enrolled students
 */
async function getCourseById(req, res, next) {
    try {
        const { id } = req.params;

        const course = await db.getOne(`
            SELECT c.*,
                   f.first_name as faculty_first_name, f.last_name as faculty_last_name,
                   f.employee_id, f.email as faculty_email
            FROM courses c
            LEFT JOIN faculty f ON c.faculty_id = f.id
            WHERE c.id = ?
        `, [id]);

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        // Enrolled students
        const students = await db.query(`
            SELECT s.id, s.roll_number, s.first_name, s.last_name, s.email,
                   s.department, s.year, s.semester, sc.enrollment_date
            FROM student_courses sc
            JOIN students s ON sc.student_id = s.id
            WHERE sc.course_id = ?
            ORDER BY s.roll_number ASC
        `, [id]);

        // Examinations for this course
        const examinations = await db.query(`
            SELECT * FROM examinations WHERE course_id = ? ORDER BY exam_date ASC
        `, [id]);

        res.json({
            success: true,
            data: {
                course,
                students,
                examinations
            }
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Create a new course
 */
async function createCourse(req, res, next) {
    try {
        const { course_code, course_name, description, credits, department, semester, faculty_id } = req.body;

        if (!course_code || !course_name || !department || !semester) {
            return res.status(400).json({
                success: false,
                message: 'Required fields: course_code, course_name, department, semester'
            });
        }

        const existing = await db.getOne('SELECT id FROM courses WHERE course_code = ?', [course_code.trim().toUpperCase()]);
        if (existing) {
            return res.status(409).json({
                success: false,
                message: 'A course with this course code already exists'
            });
        }

        const result = await db.execute(`
            INSERT INTO courses (course_code, course_name, description, credits, department, semester, faculty_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            course_code.trim().toUpperCase(),
            course_name.trim(),
            description || null,
            parseInt(credits || 3, 10),
            department.trim(),
            parseInt(semester, 10),
            faculty_id ? parseInt(faculty_id, 10) : null
        ]);

        const newCourse = await db.getOne('SELECT * FROM courses WHERE id = ?', [result.insertId]);

        res.status(201).json({
            success: true,
            message: 'Course created successfully',
            data: newCourse
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Update course details
 */
async function updateCourse(req, res, next) {
    try {
        const { id } = req.params;
        const { course_name, description, credits, department, semester, faculty_id } = req.body;

        const existing = await db.getOne('SELECT * FROM courses WHERE id = ?', [id]);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        await db.execute(`
            UPDATE courses SET
                course_name = COALESCE(?, course_name),
                description = COALESCE(?, description),
                credits = COALESCE(?, credits),
                department = COALESCE(?, department),
                semester = COALESCE(?, semester),
                faculty_id = ?
            WHERE id = ?
        `, [
            course_name ? course_name.trim() : null,
            description !== undefined ? description : null,
            credits ? parseInt(credits, 10) : null,
            department ? department.trim() : null,
            semester ? parseInt(semester, 10) : null,
            faculty_id !== undefined ? (faculty_id ? parseInt(faculty_id, 10) : null) : existing.faculty_id,
            id
        ]);

        const updated = await db.getOne('SELECT * FROM courses WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Course updated successfully',
            data: updated
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Delete course
 */
async function deleteCourse(req, res, next) {
    try {
        const { id } = req.params;
        const existing = await db.getOne('SELECT * FROM courses WHERE id = ?', [id]);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        await db.execute('DELETE FROM courses WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Course deleted successfully'
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Enroll student in course
 */
async function enrollStudent(req, res, next) {
    try {
        const { id } = req.params; // course_id
        const { student_id, enrollment_date } = req.body;

        if (!student_id) {
            return res.status(400).json({ success: false, message: 'student_id is required' });
        }

        const student = await db.getOne('SELECT id FROM students WHERE id = ?', [student_id]);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        const course = await db.getOne('SELECT id FROM courses WHERE id = ?', [id]);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        const existingEnrollment = await db.getOne(
            'SELECT id FROM student_courses WHERE student_id = ? AND course_id = ?',
            [student_id, id]
        );
        if (existingEnrollment) {
            return res.status(409).json({ success: false, message: 'Student is already enrolled in this course' });
        }

        await db.execute(
            'INSERT INTO student_courses (student_id, course_id, enrollment_date) VALUES (?, ?, ?)',
            [student_id, id, enrollment_date || new Date().toISOString().split('T')[0]]
        );

        res.status(201).json({
            success: true,
            message: 'Student successfully enrolled in course'
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Unenroll student from course
 */
async function unenrollStudent(req, res, next) {
    try {
        const { id, studentId } = req.params;

        const result = await db.execute(
            'DELETE FROM student_courses WHERE course_id = ? AND student_id = ?',
            [id, studentId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Enrollment record not found' });
        }

        res.json({
            success: true,
            message: 'Student successfully unenrolled from course'
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getAllCourses,
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse,
    enrollStudent,
    unenrollStudent
};
