# College Management System - Database Documentation

This folder contains the complete relational database design for the College Management System.

## Files
- `schema.sql`: Contains the complete MySQL DDL table schemas, primary keys, foreign keys, constraints, and indexes.
- `seed.sql`: Contains sample demo data with realistic records for all roles, departments, courses, enrollments, attendance, examinations, marks, fees, and payment transactions.

## Database Entities & Relationships
- **departments**: Academic departments (CSE, IT, ECE, ME).
- **users**: System authentication credentials, bcrypt password hashes, and user roles (`ADMIN`, `FACULTY`, `STUDENT`).
- **students**: Comprehensive student profile linked to `users(id)` via 1-to-1 relationship.
- **faculty**: Faculty members linked to `users(id)` via 1-to-1 relationship.
- **courses**: Academic courses assigned to a faculty member via `faculty_id`.
- **student_courses**: Many-to-Many junction linking students and enrolled courses with unique constraint.
- **attendance**: Daily attendance records per student, course, and date with unique constraint to prevent duplicates.
- **examinations**: Scheduled exams for specific courses and semesters.
- **marks**: Academic scores and grades per student and exam.
- **fees**: Fee assessments assigned to students with status (`PAID`, `PENDING`, `PARTIAL`).
- **payments**: Monetary transaction ledger tracking amounts paid against specific fee records.

## Manual Import via MySQL CLI
```bash
# 1. Log in to MySQL and create/import schema
mysql -u root -p < schema.sql

# 2. Seed demo dataset
mysql -u root -p < seed.sql
```

## Automated Import via Backend
```bash
cd ../backend
npm run db:init
npm run db:seed
```
