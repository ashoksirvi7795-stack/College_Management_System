const request = require('supertest');
const app = require('../app');
const db = require('../config/db');
const seedDb = require('../utils/seedDb');

let adminToken = '';
let facultyToken = '';
let studentToken = '';

let passedCount = 0;
let failedCount = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`  ✓ PASS: ${message}`);
        passedCount++;
    } else {
        console.error(`  ✗ FAIL: ${message}`);
        failedCount++;
    }
}

async function runAllTests() {
    console.log('====================================================');
    console.log('College Management System - Automated API Test Suite');
    console.log('====================================================\n');

    // 0. Ensure seeded state
    console.log('[Setup] Seeding database...');
    await seedDb();
    console.log('[Setup] Database ready.\n');

    // 1. AUTHENTICATION TESTS
    console.log('--- Test Suite 1: Authentication & JWT Generation ---');
    {
        // Admin login
        const resAdmin = await request(app)
            .post('/api/auth/login')
            .send({ username: 'admin', password: 'Admin@123' });
        assert(resAdmin.status === 200 && resAdmin.body.token, 'Admin login succeeds and returns JWT token');
        adminToken = resAdmin.body.token;

        // Faculty login
        const resFac = await request(app)
            .post('/api/auth/login')
            .send({ username: 'prof.rajesh', password: 'Faculty@123' });
        assert(resFac.status === 200 && resFac.body.token, 'Faculty login succeeds and returns JWT token');
        facultyToken = resFac.body.token;

        // Student login
        const resStud = await request(app)
            .post('/api/auth/login')
            .send({ username: 'student.rahul', password: 'Student@123' });
        assert(resStud.status === 200 && resStud.body.token, 'Student login succeeds and returns JWT token');
        studentToken = resStud.body.token;

        // Invalid credentials check
        const resBad = await request(app)
            .post('/api/auth/login')
            .send({ username: 'admin', password: 'WrongPassword' });
        assert(resBad.status === 401 && !resBad.body.success, 'Invalid password correctly rejected with 401 Unauthorized');
    }
    console.log('');

    // 2. ROLE-BASED ACCESS CONTROL (RBAC)
    console.log('--- Test Suite 2: Role-Based Access Control (RBAC) ---');
    {
        // Student attempting to create a faculty member
        const resStudentCreateFac = await request(app)
            .post('/api/faculty')
            .set('Authorization', `Bearer ${studentToken}`)
            .send({ employee_id: 'HACK001', first_name: 'Bad', last_name: 'Actor' });
        assert(resStudentCreateFac.status === 403, 'Student is forbidden (403) from creating faculty');

        // Student attempting to view Admin reports
        const resStudentReport = await request(app)
            .get('/api/reports/students')
            .set('Authorization', `Bearer ${studentToken}`);
        assert(resStudentReport.status === 403, 'Student is forbidden (403) from viewing admin reports');

        // Faculty attempting to delete a user
        const resFacDeleteUser = await request(app)
            .delete('/api/users/1')
            .set('Authorization', `Bearer ${facultyToken}`);
        assert(resFacDeleteUser.status === 403, 'Faculty is forbidden (403) from deleting system users');
    }
    console.log('');

    // 3. STUDENT MANAGEMENT CRUD
    let createdStudentId = null;
    console.log('--- Test Suite 3: Student Management CRUD ---');
    {
        // Create student
        const resCreate = await request(app)
            .post('/api/students')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                roll_number: 'TEST2026001',
                first_name: 'TestFirstName',
                last_name: 'TestLastName',
                email: 'test.student@college.edu',
                department: 'Computer Science & Engineering',
                year: 1,
                semester: 2,
                phone: '+1-555-9988'
            });
        assert(resCreate.status === 201 && resCreate.body.success, 'Admin creates a new student with status 201');
        createdStudentId = resCreate.body.data?.id;

        // Retrieve student list
        const resList = await request(app)
            .get('/api/students?q=TEST2026001')
            .set('Authorization', `Bearer ${adminToken}`);
        assert(resList.status === 200 && resList.body.data.length > 0, 'Admin searches and retrieves the newly created student');

        // Retrieve student by ID
        const resGetOne = await request(app)
            .get(`/api/students/${createdStudentId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        assert(resGetOne.status === 200 && resGetOne.body.data?.student?.roll_number === 'TEST2026001', 'Admin retrieves full student profile by ID');

        // Update student
        const resUpdate = await request(app)
            .put(`/api/students/${createdStudentId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ first_name: 'UpdatedName' });
        assert(resUpdate.status === 200 && resUpdate.body.data?.first_name === 'UpdatedName', 'Admin updates student profile successfully');

        // Delete student
        const resDelete = await request(app)
            .delete(`/api/students/${createdStudentId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        assert(resDelete.status === 200 && resDelete.body.success, 'Admin deletes student successfully');
    }
    console.log('');

    // 4. COURSE MANAGEMENT & ENROLLMENT
    let testCourseId = null;
    console.log('--- Test Suite 4: Course Management & Student Enrollment ---');
    {
        const resCourse = await request(app)
            .post('/api/courses')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                course_code: 'TEST101',
                course_name: 'Introduction to Automated Testing',
                description: 'Fundamentals of software test automation and assertions.',
                credits: 3,
                department: 'Computer Science & Engineering',
                semester: 4,
                faculty_id: 1
            });
        assert(resCourse.status === 201 && resCourse.body.success, 'Admin creates course TEST101');
        testCourseId = resCourse.body.data?.id;

        // Enroll Alex (student id 1) in course
        const resEnroll = await request(app)
            .post(`/api/courses/${testCourseId}/enroll`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ student_id: 1 });
        assert(resEnroll.status === 201 && resEnroll.body.success, 'Admin enrolls student in TEST101');

        // Prevent duplicate enrollment
        const resDupEnroll = await request(app)
            .post(`/api/courses/${testCourseId}/enroll`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ student_id: 1 });
        assert(resDupEnroll.status === 409, 'Duplicate course enrollment properly prevented with 409 Conflict');
    }
    console.log('');

    // 5. ATTENDANCE & DUPLICATE PREVENTION
    console.log('--- Test Suite 5: Attendance Marking & Duplicate Prevention ---');
    {
        const todayStr = '2026-03-01';

        // 1. Faculty marks attendance as PRESENT
        const resAtt1 = await request(app)
            .post('/api/attendance')
            .set('Authorization', `Bearer ${facultyToken}`)
            .send({
                course_id: testCourseId,
                date: todayStr,
                records: [{ student_id: 1, status: 'PRESENT' }]
            });
        assert(resAtt1.status === 200 && resAtt1.body.success, 'Faculty marks attendance PRESENT for student 1');

        // 2. Duplicate prevention test: Faculty marks attendance again for the same student+course+date with status LATE
        const resAttDup = await request(app)
            .post('/api/attendance')
            .set('Authorization', `Bearer ${facultyToken}`)
            .send({
                course_id: testCourseId,
                date: todayStr,
                records: [{ student_id: 1, status: 'LATE' }]
            });
        assert(resAttDup.status === 200, 'Re-marking same date updates status smoothly instead of duplicating row');

        // 3. Verify exactly 1 attendance record exists for this student+course+date and status is LATE
        const resVerifyAtt = await request(app)
            .get(`/api/attendance?course_id=${testCourseId}&date=${todayStr}&student_id=1`)
            .set('Authorization', `Bearer ${facultyToken}`);
        assert(resVerifyAtt.body.data?.length === 1 && resVerifyAtt.body.data[0].status === 'LATE', 'Verified duplicate prevented: Exactly 1 record with status LATE');
    }
    console.log('');

    // 6. EXAMINATION & BACKEND GRADE COMPUTATION
    console.log('--- Test Suite 6: Examination Scheduling & Backend Grade Calculation ---');
    {
        // 1. Create exam
        const resExam = await request(app)
            .post('/api/examinations')
            .set('Authorization', `Bearer ${facultyToken}`)
            .send({
                exam_name: 'Unit Test Exam 1',
                exam_type: 'Midterm',
                course_id: testCourseId,
                exam_date: '2026-04-10',
                semester: 4,
                academic_year: '2025-2026'
            });
        assert(resExam.status === 201 && resExam.body.success, 'Faculty schedules examination');
        const examId = resExam.body.data?.id;

        // 2. Enter marks: 92/100 -> Backend must calculate grade 'A+'
        const resMarkA = await request(app)
            .post('/api/marks')
            .set('Authorization', `Bearer ${facultyToken}`)
            .send({
                examination_id: examId,
                records: [{ student_id: 1, marks_obtained: 92.00, maximum_marks: 100 }]
            });
        assert(resMarkA.status === 200, 'Faculty enters 92/100 marks');

        const resCheckGradeA = await request(app)
            .get(`/api/marks?examination_id=${examId}&student_id=1`)
            .set('Authorization', `Bearer ${adminToken}`);
        assert(resCheckGradeA.body.data[0]?.grade === 'A+', 'Backend business logic automatically assigns grade "A+" for 92%');

        // 3. Update marks: 74/100 -> Backend must calculate grade 'B'
        const markRecordId = resCheckGradeA.body.data[0].id;
        const resUpdateMark = await request(app)
            .put(`/api/marks/${markRecordId}`)
            .set('Authorization', `Bearer ${facultyToken}`)
            .send({ marks_obtained: 74.00, maximum_marks: 100 });
        assert(resUpdateMark.body.data?.grade === 'B', 'Backend business logic automatically re-computes grade "B" for 74%');

        // 4. Validation: Marks cannot exceed maximum marks
        const resExceed = await request(app)
            .put(`/api/marks/${markRecordId}`)
            .set('Authorization', `Bearer ${facultyToken}`)
            .send({ marks_obtained: 110.00, maximum_marks: 100 });
        assert(resExceed.status === 400, 'Validation rejects marks exceeding maximum marks with 400 Bad Request');
    }
    console.log('');

    // 7. FEE MANAGEMENT & PAYMENT BALANCES
    console.log('--- Test Suite 7: Fee Ledger & Payment Balance Computation ---');
    {
        // 1. Admin creates fee of $1000.00 for student 1
        const resFee = await request(app)
            .post('/api/fees')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                student_id: 1,
                fee_type: 'Campus Activity & Sports Fee',
                amount: 1000.00,
                due_date: '2026-05-01'
            });
        assert(resFee.status === 201 && resFee.body.data?.status === 'PENDING', 'Admin creates ₹1000 fee with initial status PENDING');
        const feeId = resFee.body.data.id;

        // 2. Partial payment of ₹400.00
        const resPay1 = await request(app)
            .post('/api/payments')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                fee_id: feeId,
                amount_paid: 400.00,
                payment_method: 'UPI'
            });
        assert(resPay1.status === 201 && resPay1.body.data?.transaction_id, 'Admin records partial payment of ₹400, returns transaction ID');

        // 3. Verify fee status changed to PARTIAL and balance is ₹600
        const resFeeCheck1 = await request(app)
            .get(`/api/fees/${feeId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        assert(
            resFeeCheck1.body.data?.fee?.status === 'PARTIAL' &&
            parseFloat(resFeeCheck1.body.data?.fee?.remaining_amount) === 600.00,
            'Fee status automatically updated to PARTIAL with remaining balance ₹600.00'
        );

        // 4. Overpayment rejection: trying to pay 700 when only 600 is due
        const resOverpay = await request(app)
            .post('/api/payments')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                fee_id: feeId,
                amount_paid: 700.00,
                payment_method: 'Net Banking'
            });
        assert(resOverpay.status === 400, 'Overpayment rejected by backend validation (400 Bad Request)');

        // 5. Final payment of remaining ₹600
        const resPay2 = await request(app)
            .post('/api/payments')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                fee_id: feeId,
                amount_paid: 600.00,
                payment_method: 'Net Banking'
            });
        assert(resPay2.status === 201, 'Admin records final payment of ₹600');

        // 6. Verify fee status changed to PAID and balance is ₹0
        const resFeeCheck2 = await request(app)
            .get(`/api/fees/${feeId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        assert(
            resFeeCheck2.body.data?.fee?.status === 'PAID' &&
            parseFloat(resFeeCheck2.body.data?.fee?.remaining_amount) === 0.00,
            'Fee status automatically updated to PAID with remaining balance ₹0.00'
        );
    }
    console.log('');

    // 8. DASHBOARD API
    console.log('--- Test Suite 8: Dashboard API & Statistical Aggregations ---');
    {
        const resAdminDash = await request(app)
            .get('/api/dashboard')
            .set('Authorization', `Bearer ${adminToken}`);
        assert(
            resAdminDash.status === 200 &&
            resAdminDash.body.stats?.totalStudents > 0 &&
            resAdminDash.body.stats?.totalCourses > 0 &&
            resAdminDash.body.stats?.collectedFees > 0,
            'Admin dashboard retrieves real DB metrics (students, courses, collected fees)'
        );

        const resStudentDash = await request(app)
            .get('/api/dashboard')
            .set('Authorization', `Bearer ${studentToken}`);
        assert(
            resStudentDash.status === 200 &&
            resStudentDash.body.role === 'STUDENT' &&
            Array.isArray(resStudentDash.body.enrolledCourses),
            'Student dashboard retrieves personal student metrics and enrolled courses'
        );
    }
    console.log('');

    // SUMMARY
    console.log('====================================================');
    console.log(`Test Results: ${passedCount} Passed, ${failedCount} Failed`);
    console.log('====================================================\n');

    if (failedCount > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

runAllTests().catch(err => {
    console.error('Fatal test error:', err);
    process.exit(1);
});
