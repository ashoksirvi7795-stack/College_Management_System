const db = require('../config/db');
const { calculateAttendancePercentage } = require('../utils/helpers');

/**
 * Get role-specific dashboard metrics
 */
async function getDashboardStats(req, res, next) {
    try {
        const user = req.user;

        if (user.role === 'ADMIN') {
            // 1. Core metric counts
            const studentCountRow = await db.getOne('SELECT COUNT(*) as count FROM students');
            const facultyCountRow = await db.getOne('SELECT COUNT(*) as count FROM faculty');
            const courseCountRow = await db.getOne('SELECT COUNT(*) as count FROM courses');
            const departmentCountRow = await db.getOne('SELECT COUNT(*) as count FROM departments');

            // 2. Fee metrics
            const totalFeesRow = await db.getOne('SELECT COALESCE(SUM(amount), 0) as total FROM fees');
            const collectedFeesRow = await db.getOne("SELECT COALESCE(SUM(amount_paid), 0) as collected FROM payments WHERE status = 'SUCCESS'");
            const totalFees = parseFloat(totalFeesRow?.total || 0);
            const collectedFees = parseFloat(collectedFeesRow?.collected || 0);
            const pendingFees = Math.max(0, totalFees - collectedFees);

            // 3. Attendance metrics
            const totalAttRow = await db.getOne('SELECT COUNT(*) as count FROM attendance');
            const presentAttRow = await db.getOne("SELECT COUNT(*) as count FROM attendance WHERE status = 'PRESENT'");
            const totalAtt = parseInt(totalAttRow?.count || 0, 10);
            const presentAtt = parseInt(presentAttRow?.count || 0, 10);
            const avgAttendance = calculateAttendancePercentage(presentAtt, totalAtt);

            // 4. Recent payments
            const recentPayments = await db.query(`
                SELECT p.id, p.transaction_id, p.amount_paid, p.payment_date, p.payment_method, p.status,
                       s.roll_number, s.first_name, s.last_name, f.fee_type
                FROM payments p
                JOIN students s ON p.student_id = s.id
                JOIN fees f ON p.fee_id = f.id
                ORDER BY p.payment_date DESC
                LIMIT 5
            `);

            // 5. Recent student registrations
            const recentStudents = await db.query(`
                SELECT id, roll_number, first_name, last_name, email, department, semester, created_at
                FROM students
                ORDER BY id DESC
                LIMIT 5
            `);

            // 6. Upcoming examinations
            const upcomingExams = await db.query(`
                SELECT e.id, e.exam_name, e.exam_type, e.exam_date, e.semester, e.academic_year,
                       c.course_code, c.course_name
                FROM examinations e
                JOIN courses c ON e.course_id = c.id
                ORDER BY e.exam_date ASC
                LIMIT 5
            `);

            // 7. Department distribution
            const deptDistribution = await db.query(`
                SELECT department, COUNT(*) as count
                FROM students
                GROUP BY department
            `);

            // 8. Monthly fee collections
            const monthlyPayments = await db.query(`
                SELECT SUBSTR(payment_date, 1, 7) as month, SUM(amount_paid) as total
                FROM payments
                WHERE status = 'SUCCESS'
                GROUP BY SUBSTR(payment_date, 1, 7)
                ORDER BY month ASC
                LIMIT 6
            `);

            return res.json({
                success: true,
                role: 'ADMIN',
                stats: {
                    totalStudents: parseInt(studentCountRow?.count || 0, 10),
                    totalFaculty: parseInt(facultyCountRow?.count || 0, 10),
                    totalCourses: parseInt(courseCountRow?.count || 0, 10),
                    totalDepartments: parseInt(departmentCountRow?.count || 0, 10),
                    totalFees,
                    collectedFees,
                    pendingFees,
                    avgAttendance
                },
                recentPayments,
                recentStudents,
                upcomingExams,
                deptDistribution,
                monthlyPayments
            });
        }

        if (user.role === 'FACULTY') {
            const faculty = await db.getOne('SELECT * FROM faculty WHERE user_id = ?', [user.id]);
            if (!faculty) {
                return res.status(404).json({ success: false, message: 'Faculty profile not found' });
            }

            // Faculty courses
            const courses = await db.query(`
                SELECT c.*, COUNT(sc.student_id) as enrolled_students
                FROM courses c
                LEFT JOIN student_courses sc ON c.id = sc.course_id
                WHERE c.faculty_id = ?
                GROUP BY c.id
            `, [faculty.id]);

            // Total students taught
            const studentsTaughtRow = await db.getOne(`
                SELECT COUNT(DISTINCT sc.student_id) as count
                FROM student_courses sc
                JOIN courses c ON sc.course_id = c.id
                WHERE c.faculty_id = ?
            `, [faculty.id]);

            // Upcoming exams for faculty's courses
            const upcomingExams = await db.query(`
                SELECT e.*, c.course_code, c.course_name
                FROM examinations e
                JOIN courses c ON e.course_id = c.id
                WHERE c.faculty_id = ?
                ORDER BY e.exam_date ASC
                LIMIT 5
            `, [faculty.id]);

            // Recent attendance marked
            const recentAttendance = await db.query(`
                SELECT a.date, c.course_code, c.course_name,
                       COUNT(a.id) as total_students,
                       SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) as present_count
                FROM attendance a
                JOIN courses c ON a.course_id = c.id
                WHERE c.faculty_id = ?
                GROUP BY a.date, a.course_id
                ORDER BY a.date DESC
                LIMIT 5
            `, [faculty.id]);

            return res.json({
                success: true,
                role: 'FACULTY',
                faculty,
                stats: {
                    assignedCoursesCount: courses.length,
                    totalStudentsTaught: parseInt(studentsTaughtRow?.count || 0, 10),
                    upcomingExamsCount: upcomingExams.length
                },
                courses,
                upcomingExams,
                recentAttendance
            });
        }

        if (user.role === 'STUDENT') {
            const student = await db.getOne('SELECT * FROM students WHERE user_id = ?', [user.id]);
            if (!student) {
                return res.status(404).json({ success: false, message: 'Student profile not found' });
            }

            // Enrolled courses
            const enrolledCourses = await db.query(`
                SELECT c.*, f.first_name as faculty_first_name, f.last_name as faculty_last_name
                FROM student_courses sc
                JOIN courses c ON sc.course_id = c.id
                LEFT JOIN faculty f ON c.faculty_id = f.id
                WHERE sc.student_id = ?
            `, [student.id]);

            // Overall attendance
            const totalAttRow = await db.getOne('SELECT COUNT(*) as count FROM attendance WHERE student_id = ?', [student.id]);
            const presentAttRow = await db.getOne("SELECT COUNT(*) as count FROM attendance WHERE student_id = ? AND status = 'PRESENT'", [student.id]);
            const totalAtt = parseInt(totalAttRow?.count || 0, 10);
            const presentAtt = parseInt(presentAttRow?.count || 0, 10);
            const overallAttendance = calculateAttendancePercentage(presentAtt, totalAtt);

            // Course-wise attendance breakdown
            const attendanceByCourse = await db.query(`
                SELECT c.course_code, c.course_name,
                       COUNT(a.id) as total_classes,
                       SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) as present_count,
                       SUM(CASE WHEN a.status = 'ABSENT' THEN 1 ELSE 0 END) as absent_count,
                       SUM(CASE WHEN a.status = 'LATE' THEN 1 ELSE 0 END) as late_count
                FROM student_courses sc
                JOIN courses c ON sc.course_id = c.id
                LEFT JOIN attendance a ON a.course_id = c.id AND a.student_id = ?
                WHERE sc.student_id = ?
                GROUP BY c.id
            `, [student.id, student.id]);

            // Fees
            const totalFeesRow = await db.getOne('SELECT COALESCE(SUM(amount), 0) as total FROM fees WHERE student_id = ?', [student.id]);
            const collectedFeesRow = await db.getOne("SELECT COALESCE(SUM(amount_paid), 0) as collected FROM payments WHERE student_id = ? AND status = 'SUCCESS'", [student.id]);
            const totalFees = parseFloat(totalFeesRow?.total || 0);
            const paidFees = parseFloat(collectedFeesRow?.collected || 0);
            const pendingFees = Math.max(0, totalFees - paidFees);

            // Recent marks
            const marks = await db.query(`
                SELECT m.*, e.exam_name, e.exam_type, e.exam_date, c.course_code, c.course_name
                FROM marks m
                JOIN examinations e ON m.examination_id = e.id
                JOIN courses c ON e.course_id = c.id
                WHERE m.student_id = ?
                ORDER BY e.exam_date DESC
                LIMIT 5
            `, [student.id]);

            // Upcoming exams
            const upcomingExams = await db.query(`
                SELECT e.*, c.course_code, c.course_name
                FROM student_courses sc
                JOIN examinations e ON sc.course_id = e.course_id
                JOIN courses c ON e.course_id = c.id
                WHERE sc.student_id = ?
                ORDER BY e.exam_date ASC
                LIMIT 5
            `, [student.id]);

            return res.json({
                success: true,
                role: 'STUDENT',
                student,
                stats: {
                    enrolledCoursesCount: enrolledCourses.length,
                    overallAttendance,
                    totalFees,
                    paidFees,
                    pendingFees,
                    marksCount: marks.length
                },
                enrolledCourses,
                attendanceByCourse,
                marks,
                upcomingExams
            });
        }

        res.status(400).json({ success: false, message: 'Invalid role' });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getDashboardStats
};
