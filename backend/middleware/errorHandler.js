function errorHandler(err, req, res, next) {
    console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);

    const statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);

    // Handle database duplicate key error
    if (err.code === 'ER_DUP_ENTRY' || (err.message && err.message.includes('UNIQUE constraint failed'))) {
        return res.status(409).json({
            success: false,
            message: 'A record with these unique details already exists'
        });
    }

    res.status(statusCode).json({
        success: false,
        message: err.message || 'An unexpected server error occurred'
    });
}

module.exports = errorHandler;
