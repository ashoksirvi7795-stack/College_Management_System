const crypto = require('crypto');

/**
 * Calculate Grade based on percentage
 * 90–100 = A+
 * 80–89 = A
 * 70–79 = B
 * 60–69 = C
 * 50–59 = D
 * Below 50 = F
 */
function calculateGrade(marksObtained, maximumMarks = 100) {
    if (maximumMarks <= 0) return 'F';
    const percentage = (marksObtained / maximumMarks) * 100;
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
}

/**
 * Generate unique transaction ID for payments
 * Format: TXN-YYYYMMDD-XXXXXX
 */
function generateTransactionId() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `TXN-${yyyy}${mm}${dd}-${randomHex}`;
}

/**
 * Calculate attendance percentage
 */
function calculateAttendancePercentage(presentCount, totalCount) {
    if (!totalCount || totalCount <= 0) return 0;
    return Number(((presentCount / totalCount) * 100).toFixed(1));
}

/**
 * Input validators
 */
function isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
}

function isValidPhone(phone) {
    if (!phone) return true; // Optional field
    const phoneRegex = /^[+]?[\d\s\-()]{7,20}$/;
    return phoneRegex.test(phone.trim());
}

function isPositiveNumber(val) {
    const num = Number(val);
    return !isNaN(num) && num >= 0;
}

module.exports = {
    calculateGrade,
    generateTransactionId,
    calculateAttendancePercentage,
    isValidEmail,
    isValidPhone,
    isPositiveNumber
};
