const db = require('../config/db');
const { calculateGrade } = require('../utils/helpers');

/**
 * Get marks with filters
 */
async function getMarks(req, res, next) {
    try {
        const { examination_id, course_id, student_id } = req.query;

        const params = [];
        const whereClauses = [];

        if (examination_id) {
            whereClauses.push('m.examination_id = ?');
            params.push(parseInt(examination_id, 10));
        }

        if (course_id) {
            whereClauses.push('e.course_id = ?');
            params.push(parseInt(course_id, 10));
        }

        if (student_id) {
            whereClauses.push('m.student_id = ?');
            params.push(parseInt(student_id, 10));
        }

        // If STUDENT role, restrict to their own marks
        if (req.user.role === 'STUDENT') {
            whereClauses.push('m.student_id = ?');
            params.push(req.user.studentId);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        const marks = await db.query(`
            SELECT m.*,
                   s.roll_number, s.first_name, s.last_name, s.department,
                   e.exam_name, e.exam_type, e.exam_date,
                   c.course_code, c.course_name,
                   u.username as entered_by_username
            FROM marks m
            JOIN students s ON m.student_id = s.id
            JOIN examinations e ON m.examination_id = e.id
            JOIN courses c ON e.course_id = c.id
            LEFT JOIN users u ON m.entered_by = u.id
            ${whereSql}
            ORDER BY e.exam_date DESC, s.roll_number ASC
        `, params);

        res.json({
            success: true,
            data: marks
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Record or Update Marks (Single or Bulk)
 * Grade is calculated strictly on backend!
 */
async function recordMarks(req, res, next) {
    try {
        const { examination_id, records } = req.body;
        const entered_by = req.user.id;

        if (!examination_id) {
            return res.status(400).json({ success: false, message: 'examination_id is required' });
        }

        const exam = await db.getOne('SELECT * FROM examinations WHERE id = ?', [examination_id]);
        if (!exam) {
            return res.status(404).json({ success: false, message: 'Examination not found' });
        }

        const items = Array.isArray(records) ? records : (req.body.student_id ? [{
            student_id: req.body.student_id,
            marks_obtained: req.body.marks_obtained,
            maximum_marks: req.body.maximum_marks || 100
        }] : []);

        if (items.length === 0) {
            return res.status(400).json({ success: false, message: 'At least one student mark record is required' });
        }

        // Validate items
        for (const item of items) {
            const marksObtained = parseFloat(item.marks_obtained);
            const maxMarks = parseFloat(item.maximum_marks || 100);

            if (isNaN(marksObtained) || marksObtained < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Marks obtained must be a valid non-negative number'
                });
            }

            if (marksObtained > maxMarks) {
                return res.status(400).json({
                    success: false,
                    message: `Marks obtained (${marksObtained}) cannot exceed maximum marks (${maxMarks})`
                });
            }
        }

        await db.withTransaction(async (tx) => {
            for (const item of items) {
                const studentId = parseInt(item.student_id, 10);
                const marksObtained = parseFloat(item.marks_obtained);
                const maxMarks = parseFloat(item.maximum_marks || 100);
                // Compute grade on the backend
                const grade = calculateGrade(marksObtained, maxMarks);

                const existing = await tx.query(
                    'SELECT id FROM marks WHERE student_id = ? AND examination_id = ?',
                    [studentId, examination_id]
                );

                if (existing && existing.length > 0) {
                    await tx.execute(`
                        UPDATE marks SET
                            marks_obtained = ?,
                            maximum_marks = ?,
                            grade = ?,
                            entered_by = ?
                        WHERE id = ?
                    `, [marksObtained, maxMarks, grade, entered_by, existing[0].id]);
                } else {
                    await tx.execute(`
                        INSERT INTO marks (student_id, examination_id, marks_obtained, maximum_marks, grade, entered_by)
                        VALUES (?, ?, ?, ?, ?, ?)
                    `, [studentId, examination_id, marksObtained, maxMarks, grade, entered_by]);
                }
            }
        });

        res.status(200).json({
            success: true,
            message: `Successfully saved marks for ${items.length} student(s)`
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Update single mark by ID
 */
async function updateMarkById(req, res, next) {
    try {
        const { id } = req.params;
        const { marks_obtained, maximum_marks } = req.body;

        const existing = await db.getOne('SELECT * FROM marks WHERE id = ?', [id]);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Marks record not found' });
        }

        const maxMarks = maximum_marks !== undefined ? parseFloat(maximum_marks) : parseFloat(existing.maximum_marks);
        const marksObtained = marks_obtained !== undefined ? parseFloat(marks_obtained) : parseFloat(existing.marks_obtained);

        if (marksObtained < 0 || marksObtained > maxMarks) {
            return res.status(400).json({
                success: false,
                message: `Marks obtained must be between 0 and maximum marks (${maxMarks})`
            });
        }

        const grade = calculateGrade(marksObtained, maxMarks);

        await db.execute(`
            UPDATE marks SET
                marks_obtained = ?,
                maximum_marks = ?,
                grade = ?,
                entered_by = ?
            WHERE id = ?
        `, [marksObtained, maxMarks, grade, req.user.id, id]);

        const updated = await db.getOne('SELECT * FROM marks WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Marks updated successfully',
            data: updated
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Delete marks record
 */
async function deleteMark(req, res, next) {
    try {
        const { id } = req.params;
        const existing = await db.getOne('SELECT id FROM marks WHERE id = ?', [id]);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Marks record not found' });
        }

        await db.execute('DELETE FROM marks WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Marks record deleted successfully'
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getMarks,
    recordMarks,
    updateMarkById,
    deleteMark
};
