const bcrypt = require('bcryptjs');
const db = require('../config/db');

/**
 * Get all users
 */
async function getAllUsers(req, res, next) {
    try {
        const { role, q } = req.query;
        const params = [];
        const whereClauses = [];

        if (role) {
            whereClauses.push('role = ?');
            params.push(role.trim().toUpperCase());
        }

        if (q && q.trim()) {
            whereClauses.push('(username LIKE ? OR email LIKE ?)');
            params.push(`%${q.trim()}%`, `%${q.trim()}%`);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        const users = await db.query(`
            SELECT id, username, email, role, created_at, updated_at
            FROM users
            ${whereSql}
            ORDER BY id ASC
        `, params);

        res.json({
            success: true,
            data: users
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Create a new user (Admin function)
 */
async function createUser(req, res, next) {
    try {
        const { username, email, password, role } = req.body;

        if (!username || !email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: 'All fields (username, email, password, role) are required'
            });
        }

        const validRoles = ['ADMIN', 'FACULTY', 'STUDENT'];
        if (!validRoles.includes(role.toUpperCase())) {
            return res.status(400).json({
                success: false,
                message: `Invalid role. Must be one of: ${validRoles.join(', ')}`
            });
        }

        const existing = await db.getOne('SELECT id FROM users WHERE username = ? OR email = ?', [username.trim(), email.trim().toLowerCase()]);
        if (existing) {
            return res.status(409).json({
                success: false,
                message: 'User with this username or email already exists'
            });
        }

        const hash = await bcrypt.hash(password, 10);
        const result = await db.execute(`
            INSERT INTO users (username, email, password_hash, role)
            VALUES (?, ?, ?, ?)
        `, [username.trim(), email.trim().toLowerCase(), hash, role.toUpperCase()]);

        const newUser = await db.getOne('SELECT id, username, email, role, created_at FROM users WHERE id = ?', [result.insertId]);

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: newUser
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Update user role
 */
async function updateUserRole(req, res, next) {
    try {
        const { id } = req.params;
        const { role } = req.body;

        const validRoles = ['ADMIN', 'FACULTY', 'STUDENT'];
        if (!validRoles.includes(role?.toUpperCase())) {
            return res.status(400).json({ success: false, message: 'Invalid role specified' });
        }

        await db.execute('UPDATE users SET role = ? WHERE id = ?', [role.toUpperCase(), id]);
        const updated = await db.getOne('SELECT id, username, email, role FROM users WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'User role updated',
            data: updated
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Reset password (Admin)
 */
async function resetPassword(req, res, next) {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
        }

        const hash = await bcrypt.hash(newPassword, 10);
        await db.execute('UPDATE users SET password_hash = ? WHERE id = ?', [hash, id]);

        res.json({
            success: true,
            message: 'Password reset successfully'
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Delete user
 */
async function deleteUser(req, res, next) {
    try {
        const { id } = req.params;

        // Prevent admin deleting themselves
        if (parseInt(id, 10) === req.user.id) {
            return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
        }

        await db.execute('DELETE FROM users WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'User account deleted'
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getAllUsers,
    createUser,
    updateUserRole,
    resetPassword,
    deleteUser
};
