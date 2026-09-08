const db = require('../config/db');

/**
 * Get all examinations with course info
 */
async function getAllExaminations(req, res, next) {
    try {
        const { course_id, semester, academic_year } = req.query;

        const params = [];
        const whereClauses = [];

        if (course_id) {
            whereClauses.push('e.course_id = ?');
            params.push(parseInt(course_id, 10));
        }

        if (semester) {
            whereClauses.push('e.semester = ?');
            params.push(parseInt(semester, 10));
        }

        if (academic_year) {
            whereClauses.push('e.academic_year = ?');
            params.push(academic_year.trim());
        }

        // If faculty, filter by faculty assigned courses if requested
        if (req.user.role === 'FACULTY') {
            whereClauses.push('c.faculty_id = ?');
            params.push(req.user.facultyId);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        const exams = await db.query(`
            SELECT e.*,
                   c.course_code, c.course_name, c.department,
                   f.first_name as faculty_first_name, f.last_name as faculty_last_name,
                   COUNT(m.id) as marks_entered_count
            FROM examinations e
            JOIN courses c ON e.course_id = c.id
            LEFT JOIN faculty f ON c.faculty_id = f.id
            LEFT JOIN marks m ON e.id = m.examination_id
            ${whereSql}
            GROUP BY e.id
            ORDER BY e.exam_date DESC
        `, params);

        res.json({
            success: true,
            data: exams
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Get examination by ID with student marks
 */
async function getExaminationById(req, res, next) {
    try {
        const { id } = req.params;

        const exam = await db.getOne(`
            SELECT e.*, c.course_code, c.course_name, c.department
            FROM examinations e
            JOIN courses c ON e.course_id = c.id
            WHERE e.id = ?
        `, [id]);

        if (!exam) {
            return res.status(404).json({ success: false, message: 'Examination not found' });
        }

        // Enrolled students in this exam's course
        const students = await db.query(`
            SELECT s.id as student_id, s.roll_number, s.first_name, s.last_name,
                   m.id as mark_id, m.marks_obtained, m.maximum_marks, m.grade, m.updated_at
            FROM student_courses sc
            JOIN students s ON sc.student_id = s.id
            LEFT JOIN marks m ON m.student_id = s.id AND m.examination_id = ?
            WHERE sc.course_id = ?
            ORDER BY s.roll_number ASC
        `, [id, exam.course_id]);

        res.json({
            success: true,
            data: {
                examination: exam,
                students
            }
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Create examination
 */
async function createExamination(req, res, next) {
    try {
        const { exam_name, exam_type, course_id, exam_date, semester, academic_year } = req.body;

        if (!exam_name || !exam_type || !course_id || !exam_date || !semester || !academic_year) {
            return res.status(400).json({
                success: false,
                message: 'Required fields: exam_name, exam_type, course_id, exam_date, semester, academic_year'
            });
        }

        const course = await db.getOne('SELECT id FROM courses WHERE id = ?', [course_id]);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        const result = await db.execute(`
            INSERT INTO examinations (exam_name, exam_type, course_id, exam_date, semester, academic_year)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            exam_name.trim(),
            exam_type.trim(),
            parseInt(course_id, 10),
            exam_date,
            parseInt(semester, 10),
            academic_year.trim()
        ]);

        const newExam = await db.getOne('SELECT * FROM examinations WHERE id = ?', [result.insertId]);

        res.status(201).json({
            success: true,
            message: 'Examination scheduled successfully',
            data: newExam
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Update examination
 */
async function updateExamination(req, res, next) {
    try {
        const { id } = req.params;
        const { exam_name, exam_type, exam_date, semester, academic_year } = req.body;

        const existing = await db.getOne('SELECT * FROM examinations WHERE id = ?', [id]);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Examination not found' });
        }

        await db.execute(`
            UPDATE examinations SET
                exam_name = COALESCE(?, exam_name),
                exam_type = COALESCE(?, exam_type),
                exam_date = COALESCE(?, exam_date),
                semester = COALESCE(?, semester),
                academic_year = COALESCE(?, academic_year)
            WHERE id = ?
        `, [
            exam_name ? exam_name.trim() : null,
            exam_type ? exam_type.trim() : null,
            exam_date || null,
            semester ? parseInt(semester, 10) : null,
            academic_year ? academic_year.trim() : null,
            id
        ]);

        const updated = await db.getOne('SELECT * FROM examinations WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Examination updated successfully',
            data: updated
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Delete examination
 */
async function deleteExamination(req, res, next) {
    try {
        const { id } = req.params;
        const existing = await db.getOne('SELECT * FROM examinations WHERE id = ?', [id]);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Examination not found' });
        }

        await db.execute('DELETE FROM examinations WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Examination deleted successfully'
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getAllExaminations,
    getExaminationById,
    createExamination,
    updateExamination,
    deleteExamination
};
