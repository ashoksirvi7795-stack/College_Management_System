const db = require('../config/db');
const { calculateAttendancePercentage } = require('../utils/helpers');

/**
 * Student Report
 */
async function getStudentReport(req, res, next) {
    try {
        const { department, year, semester } = req.query;

        const params = [];
        const whereClauses = [];

        if (department) {
            whereClauses.push('s.department = ?');
            params.push(department.trim());
        }
        if (year) {
            whereClauses.push('s.year = ?');
            params.push(parseInt(year, 10));
        }
        if (semester) {
            whereClauses.push('s.semester = ?');
            params.push(parseInt(semester, 10));
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        const students = await db.query(`
            SELECT s.*,
                   COUNT(DISTINCT sc.course_id) as enrolled_courses_count,
                   COALESCE(SUM(DISTINCT f.amount), 0) as total_fees,
                   COALESCE(SUM(p.amount_paid), 0) as paid_fees
            FROM students s
            LEFT JOIN student_courses sc ON s.id = sc.student_id
            LEFT JOIN fees f ON s.id = f.student_id
            LEFT JOIN payments p ON f.id = p.fee_id AND p.status = 'SUCCESS'
            ${whereSql}
            GROUP BY s.id
            ORDER BY s.roll_number ASC
        `, params);

        // Fetch attendance % for each student
        const attendanceMap = new Map();
        const attRows = await db.query(`
            SELECT student_id,
                   COUNT(id) as total_classes,
                   SUM(CASE WHEN status = 'PRESENT' THEN 1 ELSE 0 END) as present_count
            FROM attendance
            GROUP BY student_id
        `);
        for (const row of attRows) {
            attendanceMap.set(row.student_id, calculateAttendancePercentage(row.present_count, row.total_classes));
        }

        const formatted = students.map(s => {
            const totalFee = parseFloat(s.total_fees || 0);
            const paidFee = parseFloat(s.paid_fees || 0);
            return {
                ...s,
                attendance_percentage: attendanceMap.get(s.id) || 0,
                pending_fees: Math.max(0, totalFee - paidFee)
            };
        });

        res.json({
            success: true,
            data: formatted
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Faculty Workload Report
 */
async function getFacultyReport(req, res, next) {
    try {
        const { department } = req.query;
        const params = [];
        let whereSql = '';

        if (department) {
            whereSql = 'WHERE f.department = ?';
            params.push(department.trim());
        }

        const faculty = await db.query(`
            SELECT f.*,
                   COUNT(DISTINCT c.id) as assigned_courses_count,
                   COALESCE(SUM(c.credits), 0) as total_credits,
                   COUNT(DISTINCT sc.student_id) as total_students_taught
            FROM faculty f
            LEFT JOIN courses c ON f.id = c.faculty_id
            LEFT JOIN student_courses sc ON c.id = sc.course_id
            ${whereSql}
            GROUP BY f.id
            ORDER BY f.first_name ASC
        `, params);

        res.json({
            success: true,
            data: faculty
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Attendance Report
 */
async function getAttendanceReport(req, res, next) {
    try {
        const { course_id, department, start_date, end_date } = req.query;

        const params = [];
        const whereClauses = [];

        if (course_id) {
            whereClauses.push('c.id = ?');
            params.push(parseInt(course_id, 10));
        }
        if (department) {
            whereClauses.push('c.department = ?');
            params.push(department.trim());
        }
        if (start_date) {
            whereClauses.push('a.date >= ?');
            params.push(start_date);
        }
        if (end_date) {
            whereClauses.push('a.date <= ?');
            params.push(end_date);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        const courseAttendance = await db.query(`
            SELECT c.id as course_id, c.course_code, c.course_name, c.department,
                   COUNT(a.id) as total_records,
                   SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) as present_count,
                   SUM(CASE WHEN a.status = 'ABSENT' THEN 1 ELSE 0 END) as absent_count,
                   SUM(CASE WHEN a.status = 'LATE' THEN 1 ELSE 0 END) as late_count
            FROM courses c
            LEFT JOIN attendance a ON c.id = a.course_id
            ${whereSql}
            GROUP BY c.id
            ORDER BY c.course_code ASC
        `, params);

        const formatted = courseAttendance.map(item => ({
            ...item,
            attendance_percentage: calculateAttendancePercentage(item.present_count, item.total_records)
        }));

        res.json({
            success: true,
            data: formatted
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Examination & Marks Performance Report
 */
async function getMarksReport(req, res, next) {
    try {
        const { examination_id, course_id } = req.query;

        const params = [];
        const whereClauses = [];

        if (examination_id) {
            whereClauses.push('e.id = ?');
            params.push(parseInt(examination_id, 10));
        }
        if (course_id) {
            whereClauses.push('e.course_id = ?');
            params.push(parseInt(course_id, 10));
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        const examStats = await db.query(`
            SELECT e.id as examination_id, e.exam_name, e.exam_type, e.exam_date,
                   c.course_code, c.course_name,
                   COUNT(m.id) as total_students_appeared,
                   ROUND(AVG(m.marks_obtained), 2) as average_marks,
                   MAX(m.marks_obtained) as highest_marks,
                   MIN(m.marks_obtained) as lowest_marks,
                   SUM(CASE WHEN m.grade != 'F' THEN 1 ELSE 0 END) as passed_count,
                   SUM(CASE WHEN m.grade = 'F' THEN 1 ELSE 0 END) as failed_count,
                   SUM(CASE WHEN m.grade = 'A+' THEN 1 ELSE 0 END) as grade_a_plus,
                   SUM(CASE WHEN m.grade = 'A' THEN 1 ELSE 0 END) as grade_a,
                   SUM(CASE WHEN m.grade = 'B' THEN 1 ELSE 0 END) as grade_b,
                   SUM(CASE WHEN m.grade = 'C' THEN 1 ELSE 0 END) as grade_c,
                   SUM(CASE WHEN m.grade = 'D' THEN 1 ELSE 0 END) as grade_d
            FROM examinations e
            JOIN courses c ON e.course_id = c.id
            LEFT JOIN marks m ON e.id = m.examination_id
            ${whereSql}
            GROUP BY e.id
            ORDER BY e.exam_date DESC
        `, params);

        res.json({
            success: true,
            data: examStats
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Fee Collection Report
 */
async function getFeeReport(req, res, next) {
    try {
        const { status, fee_type } = req.query;

        const params = [];
        const whereClauses = [];

        if (status) {
            whereClauses.push('f.status = ?');
            params.push(status.trim().toUpperCase());
        }
        if (fee_type) {
            whereClauses.push('f.fee_type = ?');
            params.push(fee_type.trim());
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        const feeSummary = await db.query(`
            SELECT f.fee_type,
                   COUNT(f.id) as total_invoices,
                   SUM(f.amount) as total_billed,
                   COALESCE(SUM(p.amount_paid), 0) as total_collected,
                   (SUM(f.amount) - COALESCE(SUM(p.amount_paid), 0)) as total_outstanding,
                   SUM(CASE WHEN f.status = 'PAID' THEN 1 ELSE 0 END) as paid_count,
                   SUM(CASE WHEN f.status = 'PARTIAL' THEN 1 ELSE 0 END) as partial_count,
                   SUM(CASE WHEN f.status = 'PENDING' THEN 1 ELSE 0 END) as pending_count
            FROM fees f
            LEFT JOIN payments p ON f.id = p.fee_id AND p.status = 'SUCCESS'
            ${whereSql}
            GROUP BY f.fee_type
        `, params);

        res.json({
            success: true,
            data: feeSummary
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Course Enrollment Report
 */
async function getCourseReport(req, res, next) {
    try {
        const courses = await db.query(`
            SELECT c.*,
                   f.first_name as faculty_first_name, f.last_name as faculty_last_name,
                   COUNT(DISTINCT sc.student_id) as enrolled_students,
                   COUNT(DISTINCT e.id) as examinations_count
            FROM courses c
            LEFT JOIN faculty f ON c.faculty_id = f.id
            LEFT JOIN student_courses sc ON c.id = sc.course_id
            LEFT JOIN examinations e ON c.id = e.course_id
            GROUP BY c.id
            ORDER BY c.course_code ASC
        `);

        res.json({
            success: true,
            data: courses
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getStudentReport,
    getFacultyReport,
    getAttendanceReport,
    getMarksReport,
    getFeeReport,
    getCourseReport
};
