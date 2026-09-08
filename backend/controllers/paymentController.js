const db = require('../config/db');
const { generateTransactionId, isPositiveNumber } = require('../utils/helpers');

/**
 * Get all payments with filters
 */
async function getAllPayments(req, res, next) {
    try {
        const { student_id, fee_id, transaction_id, page = 1, limit = 10 } = req.query;

        const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
        const params = [];
        const countParams = [];
        let whereClauses = [];

        if (student_id) {
            whereClauses.push('p.student_id = ?');
            params.push(parseInt(student_id, 10));
            countParams.push(parseInt(student_id, 10));
        } else if (req.user.role === 'STUDENT') {
            whereClauses.push('p.student_id = ?');
            params.push(req.user.studentId);
            countParams.push(req.user.studentId);
        }

        if (fee_id) {
            whereClauses.push('p.fee_id = ?');
            params.push(parseInt(fee_id, 10));
            countParams.push(parseInt(fee_id, 10));
        }

        if (transaction_id && transaction_id.trim()) {
            whereClauses.push('p.transaction_id LIKE ?');
            params.push(`%${transaction_id.trim()}%`);
            countParams.push(`%${transaction_id.trim()}%`);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        const countRow = await db.getOne(`SELECT COUNT(*) as total FROM payments p ${whereSql}`, countParams);
        const total = parseInt(countRow?.total || 0, 10);

        params.push(parseInt(limit, 10), offset);
        const payments = await db.query(`
            SELECT p.*,
                   s.roll_number, s.first_name, s.last_name, s.department, s.email,
                   f.fee_type, f.amount as total_fee_amount
            FROM payments p
            JOIN students s ON p.student_id = s.id
            JOIN fees f ON p.fee_id = f.id
            ${whereSql}
            ORDER BY p.payment_date DESC
            LIMIT ? OFFSET ?
        `, params);

        res.json({
            success: true,
            data: payments,
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
 * Record a new payment
 */
async function recordPayment(req, res, next) {
    try {
        const { fee_id, amount_paid, payment_method, payment_date } = req.body;

        if (!fee_id || !amount_paid || !payment_method) {
            return res.status(400).json({
                success: false,
                message: 'Required fields: fee_id, amount_paid, payment_method'
            });
        }

        const amount = parseFloat(amount_paid);
        if (!isPositiveNumber(amount) || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Payment amount must be greater than 0'
            });
        }

        // Get fee and student info
        const fee = await db.getOne(`
            SELECT f.*,
                   COALESCE(SUM(p.amount_paid), 0) as total_paid
            FROM fees f
            LEFT JOIN payments p ON f.id = p.fee_id AND p.status = 'SUCCESS'
            WHERE f.id = ?
            GROUP BY f.id
        `, [fee_id]);

        if (!fee) {
            return res.status(404).json({ success: false, message: 'Fee record not found' });
        }

        const currentPaid = parseFloat(fee.total_paid || 0);
        const feeAmount = parseFloat(fee.amount);
        const remainingBalance = Number((feeAmount - currentPaid).toFixed(2));

        if (amount > remainingBalance) {
            return res.status(400).json({
                success: false,
                message: `Payment amount (₹${amount.toFixed(2)}) exceeds remaining balance (₹${remainingBalance.toFixed(2)})`
            });
        }

        const transaction_id = generateTransactionId();
        const dateString = payment_date || new Date().toISOString().slice(0, 19).replace('T', ' ');

        const result = await db.withTransaction(async (tx) => {
            // 1. Insert payment record
            const payRes = await tx.execute(`
                INSERT INTO payments (student_id, fee_id, transaction_id, amount_paid, payment_date, payment_method, status)
                VALUES (?, ?, ?, ?, ?, ?, 'SUCCESS')
            `, [
                fee.student_id,
                fee.id,
                transaction_id,
                amount,
                dateString,
                payment_method.trim()
            ]);

            // 2. Update fee status
            const newTotalPaid = Number((currentPaid + amount).toFixed(2));
            let newStatus = 'PARTIAL';
            if (newTotalPaid >= feeAmount) {
                newStatus = 'PAID';
            }

            await tx.execute('UPDATE fees SET status = ? WHERE id = ?', [newStatus, fee.id]);

            return { paymentId: payRes.insertId };
        });

        // Fetch full receipt details
        const receipt = await getReceiptData(result.paymentId);

        res.status(201).json({
            success: true,
            message: 'Payment recorded successfully',
            data: receipt
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Helper to fetch complete receipt data
 */
async function getReceiptData(paymentId) {
    const payment = await db.getOne(`
        SELECT p.*,
               s.roll_number, s.first_name, s.last_name, s.email, s.phone, s.department, s.semester, s.address,
               f.fee_type, f.amount as total_fee_amount, f.due_date, f.status as fee_status
        FROM payments p
        JOIN students s ON p.student_id = s.id
        JOIN fees f ON p.fee_id = f.id
        WHERE p.id = ?
    `, [paymentId]);

    if (!payment) return null;

    // Calculate total paid across all payments for this fee
    const sumRow = await db.getOne(`
        SELECT COALESCE(SUM(amount_paid), 0) as paid_so_far
        FROM payments
        WHERE fee_id = ? AND status = 'SUCCESS'
    `, [payment.fee_id]);

    const totalPaid = parseFloat(sumRow?.paid_so_far || 0);
    const balanceRemaining = Math.max(0, parseFloat(payment.total_fee_amount) - totalPaid);

    return {
        ...payment,
        total_paid_so_far: totalPaid,
        balance_remaining: balanceRemaining
    };
}

/**
 * Get payment receipt by ID
 */
async function getPaymentReceipt(req, res, next) {
    try {
        const { id } = req.params;
        const receipt = await getReceiptData(id);

        if (!receipt) {
            return res.status(404).json({ success: false, message: 'Receipt not found' });
        }

        if (req.user.role === 'STUDENT' && req.user.studentId !== receipt.student_id) {
            return res.status(403).json({ success: false, message: 'Access denied to this receipt' });
        }

        res.json({
            success: true,
            data: receipt
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getAllPayments,
    recordPayment,
    getPaymentReceipt
};
