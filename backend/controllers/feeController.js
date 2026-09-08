const db = require('../config/db');
const { isPositiveNumber } = require('../utils/helpers');

/**
 * Get all fees with payment totals and balance calculations
 */
async function getAllFees(req, res, next) {
    try {
        const { student_id, status, department, page = 1, limit = 10 } = req.query;

        const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
        const params = [];
        const countParams = [];
        let whereClauses = [];

        if (student_id) {
            whereClauses.push('f.student_id = ?');
            params.push(parseInt(student_id, 10));
            countParams.push(parseInt(student_id, 10));
        } else if (req.user.role === 'STUDENT') {
            whereClauses.push('f.student_id = ?');
            params.push(req.user.studentId);
            countParams.push(req.user.studentId);
        }

        if (status) {
            whereClauses.push('f.status = ?');
            params.push(status.trim().toUpperCase());
            countParams.push(status.trim().toUpperCase());
        }

        if (department) {
            whereClauses.push('s.department = ?');
            params.push(department.trim());
            countParams.push(department.trim());
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        const countRow = await db.getOne(`
            SELECT COUNT(DISTINCT f.id) as total
            FROM fees f
            JOIN students s ON f.student_id = s.id
            ${whereSql}
        `, countParams);
        const total = parseInt(countRow?.total || 0, 10);

        params.push(parseInt(limit, 10), offset);
        const fees = await db.query(`
            SELECT f.*,
                   s.roll_number, s.first_name, s.last_name, s.department, s.semester,
                   COALESCE(SUM(p.amount_paid), 0) as paid_amount,
                   (f.amount - COALESCE(SUM(p.amount_paid), 0)) as remaining_amount
            FROM fees f
            JOIN students s ON f.student_id = s.id
            LEFT JOIN payments p ON f.id = p.fee_id AND p.status = 'SUCCESS'
            ${whereSql}
            GROUP BY f.id
            ORDER BY f.due_date ASC
            LIMIT ? OFFSET ?
        `, params);

        res.json({
            success: true,
            data: fees,
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
 * Get fee by ID with payment history
 */
async function getFeeById(req, res, next) {
    try {
        const { id } = req.params;

        const fee = await db.getOne(`
            SELECT f.*,
                   s.roll_number, s.first_name, s.last_name, s.email, s.department, s.phone,
                   COALESCE(SUM(p.amount_paid), 0) as paid_amount,
                   (f.amount - COALESCE(SUM(p.amount_paid), 0)) as remaining_amount
            FROM fees f
            JOIN students s ON f.student_id = s.id
            LEFT JOIN payments p ON f.id = p.fee_id AND p.status = 'SUCCESS'
            WHERE f.id = ?
            GROUP BY f.id
        `, [id]);

        if (!fee) {
            return res.status(404).json({ success: false, message: 'Fee record not found' });
        }

        if (req.user.role === 'STUDENT' && req.user.studentId !== fee.student_id) {
            return res.status(403).json({ success: false, message: 'Access denied to this fee record' });
        }

        const payments = await db.query(`
            SELECT * FROM payments WHERE fee_id = ? ORDER BY payment_date DESC
        `, [id]);

        res.json({
            success: true,
            data: {
                fee,
                payments
            }
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Create a new fee obligation
 */
async function createFee(req, res, next) {
    try {
        const { student_id, fee_type, amount, due_date } = req.body;

        if (!student_id || !fee_type || !amount || !due_date) {
            return res.status(400).json({
                success: false,
                message: 'Required fields: student_id, fee_type, amount, due_date'
            });
        }

        if (!isPositiveNumber(amount) || parseFloat(amount) <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Fee amount must be a positive number'
            });
        }

        const student = await db.getOne('SELECT id FROM students WHERE id = ?', [student_id]);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        const result = await db.execute(`
            INSERT INTO fees (student_id, fee_type, amount, due_date, status)
            VALUES (?, ?, ?, ?, 'PENDING')
        `, [
            parseInt(student_id, 10),
            fee_type.trim(),
            parseFloat(amount),
            due_date
        ]);

        const newFee = await db.getOne('SELECT * FROM fees WHERE id = ?', [result.insertId]);

        res.status(201).json({
            success: true,
            message: 'Fee obligation created successfully',
            data: newFee
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Update fee record
 */
async function updateFee(req, res, next) {
    try {
        const { id } = req.params;
        const { fee_type, amount, due_date } = req.body;

        const existing = await db.getOne('SELECT * FROM fees WHERE id = ?', [id]);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Fee record not found' });
        }

        if (amount !== undefined && (!isPositiveNumber(amount) || parseFloat(amount) <= 0)) {
            return res.status(400).json({ success: false, message: 'Amount must be a positive number' });
        }

        await db.execute(`
            UPDATE fees SET
                fee_type = COALESCE(?, fee_type),
                amount = COALESCE(?, amount),
                due_date = COALESCE(?, due_date)
            WHERE id = ?
        `, [
            fee_type ? fee_type.trim() : null,
            amount ? parseFloat(amount) : null,
            due_date || null,
            id
        ]);

        // Recompute status based on payments
        const paidRow = await db.getOne("SELECT COALESCE(SUM(amount_paid), 0) as paid FROM payments WHERE fee_id = ? AND status = 'SUCCESS'", [id]);
        const totalPaid = parseFloat(paidRow?.paid || 0);
        const feeAmount = amount ? parseFloat(amount) : parseFloat(existing.amount);

        let status = 'PENDING';
        if (totalPaid >= feeAmount) {
            status = 'PAID';
        } else if (totalPaid > 0) {
            status = 'PARTIAL';
        }

        await db.execute('UPDATE fees SET status = ? WHERE id = ?', [status, id]);

        const updated = await db.getOne('SELECT * FROM fees WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Fee record updated successfully',
            data: updated
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Delete fee record
 */
async function deleteFee(req, res, next) {
    try {
        const { id } = req.params;
        const existing = await db.getOne('SELECT id FROM fees WHERE id = ?', [id]);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Fee record not found' });
        }

        await db.execute('DELETE FROM fees WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Fee record deleted successfully'
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getAllFees,
    getFeeById,
    createFee,
    updateFee,
    deleteFee
};
