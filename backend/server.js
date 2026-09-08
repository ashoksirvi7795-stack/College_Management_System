const app = require('./app');
const db = require('./config/db');
const initDb = require('./utils/initDb');

const PORT = process.env.PORT || 5050;

async function startServer() {
    try {
        console.log('[Server] Connecting to database...');
        await db.connectDb();
        console.log(`[Server] Database connected using ${db.getDialect()}`);

        // Ensure database tables are initialized
        try {
            const userCheck = await db.getOne('SELECT count(*) as c FROM users');
            if (!userCheck || userCheck.c === 0) {
                console.log('[Server] Database is empty. Running auto-initialization and seeding...');
                const seedDb = require('./utils/seedDb');
                await seedDb();
            }
        } catch (err) {
            console.log('[Server] Initializing database schema...');
            await initDb();
        }

        app.listen(PORT, () => {
            console.log(`[Server] College Management System backend running on http://localhost:${PORT}`);
            console.log(`[Server] API Health check available at http://localhost:${PORT}/api/health`);
        });
    } catch (err) {
        console.error('[Server] Fatal startup error:', err);
        process.exit(1);
    }
}

startServer();
