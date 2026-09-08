const db = require('../config/db');
const { calculateAttendancePercentage } = require('../utils/helpers');

/**
 * Get attendance records with filters
 */
async function getAttendance(req, res, next) {
    try {
        const { course_id, date, student_id, status } = req.query;

        const params = [];
        let whereClauses = [];

        if (course_id) {
            whereClauses.push('a.course_id = ?');
            params.push(parseInt(course_id, 10));
        }

        if (date) {
            whereClauses.push('a.date = ?');
            params.push(date.trim());
        }

        if (student_id) {
            whereClauses.push('a.student_id = ?');
            params.push(parseInt(student_id, 10));
        }

        if (status) {
            whereClauses.push('a.status = ?');
            params.push(status.trim().toUpperCase());
        }

        // If STUDENT role, restrict to their own records
        if (req.user.role === 'STUDENT') {
            whereClauses.push('a.student_id = ?');
            params.push(req.user.studentId);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        const attendance = await db.query(`
            SELECT a.*,
                   s.roll_number, s.first_name, s.last_name, s.department,
                   c.course_code, c.course_name,
                   u.username as marked_by_username
            FROM attendance a
            JOIN students s ON a.student_id = s.id
            JOIN courses c ON a.course_id = c.id
            LEFT JOIN users u ON a.marked_by = u.id
            ${whereSql}
            ORDER BY a.date DESC, s.roll_number ASC
        `, params);

        res.json({
            success: true,
            data: attendance
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Mark Attendance (Single or Bulk)
 * Enforces duplicate prevention and updates existing record if exists
 */
async function markAttendance(req, res, next) {
    try {
        const { course_id, date, records } = req.body;
        // records: array of { student_id, status } or single record { student_id, status }
        const marked_by = req.user.id;

        if (!course_id || !date) {
            return res.status(400).json({
                success: false,
                message: 'course_id and date are required'
            });
        }

        const items = Array.isArray(records) ? records : (req.body.student_id ? [{ student_id: req.body.student_id, status: req.body.status }] : []);

        if (items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one student attendance record is required'
            });
        }

        const validStatuses = ['PRESENT', 'ABSENT', 'LATE'];
        for (const item of items) {
            if (!item.student_id || !validStatuses.includes(item.status?.toUpperCase())) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid attendance item. Valid statuses: ${validStatuses.join(', ')}`
                });
            }
        }

        await db.withTransaction(async (tx) => {
            for (const item of items) {
                const status = item.status.toUpperCase();
                const studentId = parseInt(item.student_id, 10);

                // Check if record exists
                const existing = await tx.query(
                    'SELECT id FROM attendance WHERE student_id = ? AND course_id = ? AND date = ?',
                    [studentId, course_id, date]
                );

                if (existing && existing.length > 0) {
                    // Update existing attendance
                    await tx.execute(
                        'UPDATE attendance SET status = ?, marked_by = ? WHERE id = ?',
                        [status, marked_by, existing[0].id]
                    );
                } else {
                    // Insert new attendance record
                    await tx.execute(
                        'INSERT INTO attendance (student_id, course_id, date, status, marked_by) VALUES (?, ?, ?, ?, ?)',
                        [studentId, course_id, date, status, marked_by]
                    );
                }
            }
        });

        res.status(200).json({
            success: true,
            message: `Attendance successfully saved for ${items.length} student(s)`
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Get attendance summary & percentages for course or student
 */
async function getAttendanceSummary(req, res, next) {
    try {
        const { course_id, student_id } = req.query;

        let querySql = `
            SELECT s.id as student_id, s.roll_number, s.first_name, s.last_name,
                   c.id as course_id, c.course_code, c.course_name,
                   COUNT(a.id) as total_classes,
                   SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) as present_count,
                   SUM(CASE WHEN a.status = 'ABSENT' THEN 1 ELSE 0 END) as absent_count,
                   SUM(CASE WHEN a.status = 'LATE' THEN 1 ELSE 0 END) as late_count
            FROM student_courses sc
            JOIN students s ON sc.student_id = s.id
            JOIN courses c ON sc.course_id = c.id
            LEFT JOIN attendance a ON a.course_id = c.id AND a.student_id = s.id
        `;

        const params = [];
        const whereClauses = [];

        if (course_id) {
            whereClauses.push('c.id = ?');
            params.push(parseInt(course_id, 10));
        }

        if (student_id) {
            whereClauses.push('s.id = ?');
            params.push(parseInt(student_id, 10));
        } else if (req.user.role === 'STUDENT') {
            whereClauses.push('s.id = ?');
            params.push(req.user.studentId);
        }

        if (whereClauses.length > 0) {
            querySql += ` WHERE ${whereClauses.join(' AND ')}`;
        }

        querySql += ` GROUP BY s.id, c.id ORDER BY s.roll_number ASC, c.course_code ASC`;

        const rows = await db.query(querySql, params);

        const formatted = rows.map(r => ({
            ...r,
            attendance_percentage: calculateAttendancePercentage(r.present_count, r.total_classes)
        }));

        res.json({
            success: true,
            data: formatted
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getAttendance,
    markAttendance,
    getAttendanceSummary
};
