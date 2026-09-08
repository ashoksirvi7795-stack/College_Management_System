const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_college_management_jwt_key_2026_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Login user
 */
async function login(req, res, next) {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide both username (or email) and password'
            });
        }

        // Search by username or email
        const user = await db.getOne(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [username.trim(), username.trim().toLowerCase()]
        );

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials. User not found.'
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials. Incorrect password.'
            });
        }

        // Fetch linked profile info based on role
        let profile = null;
        if (user.role === 'STUDENT') {
            profile = await db.getOne('SELECT * FROM students WHERE user_id = ?', [user.id]);
        } else if (user.role === 'FACULTY') {
            profile = await db.getOne('SELECT * FROM faculty WHERE user_id = ?', [user.id]);
        }

        // Generate JWT
        const token = jwt.sign(
            {
                userId: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                profile
            }
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Get current authenticated user details
 */
async function getCurrentUser(req, res, next) {
    try {
        const user = await db.getOne(
            'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
            [req.user.id]
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User profile not found'
            });
        }

        let profile = null;
        if (user.role === 'STUDENT') {
            profile = await db.getOne('SELECT * FROM students WHERE user_id = ?', [user.id]);
        } else if (user.role === 'FACULTY') {
            profile = await db.getOne('SELECT * FROM faculty WHERE user_id = ?', [user.id]);
        }

        res.json({
            success: true,
            user: {
                ...user,
                profile
            }
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Change password
 */
async function changePassword(req, res, next) {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Both current and new password are required'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters long'
            });
        }

        const user = await db.getOne('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Incorrect current password'
            });
        }

        const newHash = await bcrypt.hash(newPassword, 10);
        await db.execute('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.user.id]);

        res.json({
            success: true,
            message: 'Password successfully updated'
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    login,
    getCurrentUser,
    changePassword
};
