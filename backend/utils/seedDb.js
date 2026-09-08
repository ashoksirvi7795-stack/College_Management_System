const fs = require('fs');
const path = require('path');
const db = require('../config/db');
const initDb = require('./initDb');

async function seedDb() {
    await initDb();
    const dialect = db.getDialect();
    console.log(`[SeedDB] Seeding database using dialect: ${dialect}`);

    const seedPath = path.resolve(__dirname, '../../database/seed.sql');
    let sql = fs.readFileSync(seedPath, 'utf8');

    if (dialect === 'mysql') {
        const statements = sql
            .replace(/--.*$/gm, '')
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (const statement of statements) {
            try {
                await db.query(statement);
            } catch (err) {
                console.error(`[SeedDB] Error on: ${statement.slice(0, 80)}...`, err.message);
                throw err;
            }
        }
    } else {
        // SQLite adaptation
        let sqliteSql = sql
            .replace(/USE [^;]+;/gi, '')
            .replace(/SET FOREIGN_KEY_CHECKS\s*=\s*0;/gi, 'PRAGMA foreign_keys = OFF;')
            .replace(/SET FOREIGN_KEY_CHECKS\s*=\s*1;/gi, 'PRAGMA foreign_keys = ON;')
            .replace(/TRUNCATE TABLE ([a-zA-Z0-9_]+);/gi, 'DELETE FROM $1;');

        const statements = sqliteSql
            .replace(/--.*$/gm, '')
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (const statement of statements) {
            try {
                await db.execute(statement);
            } catch (err) {
                console.error(`[SeedDB] SQLite Error on: ${statement.slice(0, 80)}...`, err.message);
                throw err;
            }
        }
    }

    console.log('[SeedDB] Database seeded successfully.');
}

if (require.main === module) {
    seedDb()
        .then(() => {
            console.log('[SeedDB] Completed successfully.');
            process.exit(0);
        })
        .catch(err => {
            console.error('[SeedDB] Failed:', err);
            process.exit(1);
        });
}

module.exports = seedDb;
