-- ==========================================================
-- College Management System - Demo Seed Data
-- ==========================================================

USE college_db;

-- Clear previous data in correct foreign key order
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE payments;
TRUNCATE TABLE fees;
TRUNCATE TABLE marks;
TRUNCATE TABLE examinations;
TRUNCATE TABLE attendance;
TRUNCATE TABLE student_courses;
TRUNCATE TABLE courses;
TRUNCATE TABLE faculty;
TRUNCATE TABLE students;
TRUNCATE TABLE users;
TRUNCATE TABLE departments;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. DEPARTMENTS
INSERT INTO departments (id, department_name, department_code) VALUES
(1, 'Computer Science & Engineering', 'CSE'),
(2, 'Information Technology', 'IT'),
(3, 'Electronics & Communication', 'ECE'),
(4, 'Mechanical Engineering', 'ME');

-- 2. USERS
-- Passwords:
-- Admin: Admin@123 ($2a$10$upPyde4urdXAUaVb8In9LuNT7r0AVgaIZwM/CuR5qsLVhBWU5MvXW)
-- Faculty: Faculty@123 ($2a$10$mnGz5lfr8p8k5oiq5f4XGeN8/tjPqXBZ6.EceRIxQmTtChR4Ch7ZW)
-- Student: Student@123 ($2a$10$NIhBDLKM1M1eKoxnK51tqeAqI50AcFI3XmdjvmuMeR5Sm1VsrHtBW)

INSERT INTO users (id, username, email, password_hash, role) VALUES
(1, 'admin', 'admin@college.edu.in', '$2a$10$upPyde4urdXAUaVb8In9LuNT7r0AVgaIZwM/CuR5qsLVhBWU5MvXW', 'ADMIN'),
(2, 'prof.rajesh', 'rajesh.sharma@college.edu.in', '$2a$10$mnGz5lfr8p8k5oiq5f4XGeN8/tjPqXBZ6.EceRIxQmTtChR4Ch7ZW', 'FACULTY'),
(3, 'prof.ananya', 'ananya.iyer@college.edu.in', '$2a$10$mnGz5lfr8p8k5oiq5f4XGeN8/tjPqXBZ6.EceRIxQmTtChR4Ch7ZW', 'FACULTY'),
(4, 'student.rahul', 'rahul.sharma@college.edu.in', '$2a$10$NIhBDLKM1M1eKoxnK51tqeAqI50AcFI3XmdjvmuMeR5Sm1VsrHtBW', 'STUDENT'),
(5, 'student.sneha', 'sneha.reddy@college.edu.in', '$2a$10$NIhBDLKM1M1eKoxnK51tqeAqI50AcFI3XmdjvmuMeR5Sm1VsrHtBW', 'STUDENT'),
(6, 'student.aarav', 'aarav.patel@college.edu.in', '$2a$10$NIhBDLKM1M1eKoxnK51tqeAqI50AcFI3XmdjvmuMeR5Sm1VsrHtBW', 'STUDENT'),
(7, 'student.priya', 'priya.nair@college.edu.in', '$2a$10$NIhBDLKM1M1eKoxnK51tqeAqI50AcFI3XmdjvmuMeR5Sm1VsrHtBW', 'STUDENT');

-- 3. FACULTY PROFILES
INSERT INTO faculty (id, user_id, employee_id, first_name, last_name, email, phone, department, designation, joining_date) VALUES
(1, 2, 'FAC-CSE-001', 'Rajesh', 'Sharma', 'rajesh.sharma@college.edu.in', '+91-9845012345', 'Computer Science & Engineering', 'Professor & HOD', '2020-07-15'),
(2, 3, 'FAC-IT-002', 'Ananya', 'Iyer', 'ananya.iyer@college.edu.in', '+91-9845067890', 'Information Technology', 'Associate Professor', '2021-01-10');

-- 4. STUDENT PROFILES
INSERT INTO students (id, user_id, roll_number, first_name, last_name, date_of_birth, gender, phone, email, address, department, year, semester, admission_date) VALUES
(1, 4, '2024CSE001', 'Rahul', 'Sharma', '2004-05-14', 'Male', '+91-9123456789', 'rahul.sharma@college.edu.in', '#42, 5th Cross, Indiranagar, Bengaluru, Karnataka 560038', 'Computer Science & Engineering', 2, 4, '2023-08-01'),
(2, 5, '2024CSE002', 'Sneha', 'Reddy', '2004-08-22', 'Female', '+91-9123456790', 'sneha.reddy@college.edu.in', 'Flat 304, Green Glen Layout, Bellandur, Bengaluru, Karnataka 560103', 'Computer Science & Engineering', 2, 4, '2023-08-01'),
(3, 6, '2024IT001', 'Aarav', 'Patel', '2003-11-30', 'Male', '+91-9123456791', 'aarav.patel@college.edu.in', '12/A, Road No. 3, Banjara Hills, Hyderabad, Telangana 500034', 'Information Technology', 2, 4, '2023-08-01'),
(4, 7, '2024IT002', 'Priya', 'Nair', '2004-02-18', 'Female', '+91-9123456792', 'priya.nair@college.edu.in', 'Plot 56, 2nd Avenue, Anna Nagar West, Chennai, Tamil Nadu 600040', 'Information Technology', 2, 4, '2023-08-01');

-- 5. COURSES
INSERT INTO courses (id, course_code, course_name, description, credits, department, semester, faculty_id) VALUES
(1, 'CS401', 'Database Management Systems', 'Relational database theory, normalization, SQL, indexing, and transaction management.', 4, 'Computer Science & Engineering', 4, 1),
(2, 'CS402', 'Web Technologies', 'Modern full-stack web development, client-server architecture, RESTful APIs, and security.', 3, 'Computer Science & Engineering', 4, 1),
(3, 'CS403', 'Algorithms & Data Structures', 'Advanced algorithmic paradigms, graph algorithms, NP-completeness, and data structures.', 4, 'Computer Science & Engineering', 4, 1),
(4, 'IT401', 'Cloud Computing & DevOps', 'Virtualization, containerization, microservices, and continuous integration pipelines.', 3, 'Information Technology', 4, 2),
(5, 'IT402', 'Information & Network Security', 'Cryptography, network protocols, penetration testing, and ethical hacking fundamentals.', 3, 'Information Technology', 4, 2);

-- 6. STUDENT COURSES (ENROLLMENTS)
INSERT INTO student_courses (id, student_id, course_id, enrollment_date) VALUES
(1, 1, 1, '2026-01-05'),
(2, 1, 2, '2026-01-05'),
(3, 1, 3, '2026-01-05'),
(4, 2, 1, '2026-01-05'),
(5, 2, 2, '2026-01-05'),
(6, 2, 3, '2026-01-05'),
(7, 3, 4, '2026-01-05'),
(8, 3, 5, '2026-01-05'),
(9, 4, 4, '2026-01-05'),
(10, 4, 5, '2026-01-05');

-- 7. ATTENDANCE RECORDS
INSERT INTO attendance (student_id, course_id, date, status, marked_by) VALUES
-- Course CS401
(1, 1, '2026-02-02', 'PRESENT', 2),
(2, 1, '2026-02-02', 'PRESENT', 2),
(1, 1, '2026-02-04', 'PRESENT', 2),
(2, 1, '2026-02-04', 'ABSENT', 2),
(1, 1, '2026-02-09', 'PRESENT', 2),
(2, 1, '2026-02-09', 'PRESENT', 2),
(1, 1, '2026-02-11', 'LATE', 2),
(2, 1, '2026-02-11', 'PRESENT', 2),
(1, 1, '2026-02-16', 'PRESENT', 2),
(2, 1, '2026-02-16', 'PRESENT', 2),
-- Course CS402
(1, 2, '2026-02-03', 'PRESENT', 2),
(2, 2, '2026-02-03', 'PRESENT', 2),
(1, 2, '2026-02-05', 'PRESENT', 2),
(2, 2, '2026-02-05', 'PRESENT', 2),
(1, 2, '2026-02-10', 'ABSENT', 2),
(2, 2, '2026-02-10', 'PRESENT', 2),
(1, 2, '2026-02-12', 'PRESENT', 2),
(2, 2, '2026-02-12', 'LATE', 2),
-- Course IT401
(3, 4, '2026-02-02', 'PRESENT', 3),
(4, 4, '2026-02-02', 'PRESENT', 3),
(3, 4, '2026-02-04', 'PRESENT', 3),
(4, 4, '2026-02-04', 'PRESENT', 3),
(3, 4, '2026-02-09', 'LATE', 3),
(4, 4, '2026-02-09', 'ABSENT', 3),
(3, 4, '2026-02-11', 'PRESENT', 3),
(4, 4, '2026-02-11', 'PRESENT', 3);

-- 8. EXAMINATIONS
INSERT INTO examinations (id, exam_name, exam_type, course_id, exam_date, semester, academic_year) VALUES
(1, 'DBMS Midterm Examination', 'Midterm', 1, '2026-03-10', 4, '2025-2026'),
(2, 'Web Technologies Theory Midterm', 'Midterm', 2, '2026-03-12', 4, '2025-2026'),
(3, 'Algorithms Midterm Assessment', 'Midterm', 3, '2026-03-15', 4, '2025-2026'),
(4, 'Cloud Computing Midterm Exam', 'Midterm', 4, '2026-03-11', 4, '2025-2026'),
(5, 'Information Security Assessment', 'Midterm', 5, '2026-03-14', 4, '2025-2026'),
(6, 'DBMS Advanced Lab Practical', 'Practical', 1, '2026-05-18', 4, '2025-2026');

-- 9. MARKS
INSERT INTO marks (id, student_id, examination_id, marks_obtained, maximum_marks, grade, entered_by) VALUES
(1, 1, 1, 92.50, 100.00, 'A+', 2),
(2, 2, 1, 78.00, 100.00, 'B', 2),
(3, 1, 2, 86.00, 100.00, 'A', 2),
(4, 2, 2, 89.00, 100.00, 'A', 2),
(5, 1, 3, 94.00, 100.00, 'A+', 2),
(6, 2, 3, 81.50, 100.00, 'A', 2),
(7, 3, 4, 84.00, 100.00, 'A', 3),
(8, 4, 4, 68.50, 100.00, 'C', 3),
(9, 3, 5, 75.00, 100.00, 'B', 3),
(10, 4, 5, 71.00, 100.00, 'B', 3);

-- 10. FEES
INSERT INTO fees (id, student_id, fee_type, amount, due_date, status) VALUES
(1, 1, 'Tuition Fee - Semester 4', 45000.00, '2026-02-15', 'PAID'),
(2, 1, 'Lab & Library Maintenance Fee', 5000.00, '2026-02-28', 'PARTIAL'),
(3, 2, 'Tuition Fee - Semester 4', 45000.00, '2026-02-15', 'PAID'),
(4, 2, 'Lab & Library Maintenance Fee', 5000.00, '2026-02-28', 'PENDING'),
(5, 3, 'Tuition Fee - Semester 4', 45000.00, '2026-02-15', 'PENDING'),
(6, 4, 'Tuition Fee - Semester 4', 45000.00, '2026-02-15', 'PARTIAL');

-- 11. PAYMENTS
INSERT INTO payments (id, student_id, fee_id, transaction_id, amount_paid, payment_date, payment_method, status) VALUES
(1, 1, 1, 'TXN-20260115-982143', 45000.00, '2026-01-15 10:30:00', 'Net Banking', 'SUCCESS'),
(2, 1, 2, 'TXN-20260210-481902', 2500.00, '2026-02-10 14:15:00', 'UPI', 'SUCCESS'),
(3, 2, 3, 'TXN-20260118-319082', 45000.00, '2026-01-18 11:00:00', 'Net Banking', 'SUCCESS'),
(4, 4, 6, 'TXN-20260120-721094', 22500.00, '2026-01-20 16:45:00', 'UPI', 'SUCCESS');
