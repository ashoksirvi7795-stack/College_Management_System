const fs = require('fs');
const path = require('path');
const db = require('../config/db');

async function initDb() {
    await db.connectDb();
    const dialect = db.getDialect();
    console.log(`[InitDB] Initializing database using dialect: ${dialect}`);

    const schemaPath = path.resolve(__dirname, '../../database/schema.sql');
    let sql = fs.readFileSync(schemaPath, 'utf8');

    if (dialect === 'mysql') {
        // Strip comments and execute statements
        const statements = sql
            .replace(/--.*$/gm, '')
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (const statement of statements) {
            try {
                await db.query(statement);
            } catch (err) {
                console.error(`[InitDB] MySQL Error on statement: ${statement.slice(0, 80)}...`, err.message);
                throw err;
            }
        }
    } else {
        // SQLite adaptation
        // Extract table name and transform inline indexes into CREATE INDEX statements
        const lines = sql.split('\n');
        let cleanSql = '';
        let currentTable = '';
        const createdIndexes = [];

        for (let line of lines) {
            const tableMatch = line.match(/CREATE TABLE IF NOT EXISTS\s+([a-zA-Z0-9_]+)/i);
            if (tableMatch) {
                currentTable = tableMatch[1];
            }

            const indexMatch = line.match(/^\s*,?\s*INDEX\s+([a-zA-Z0-9_]+)\s*\(([^)]+)\)\s*,?$/i);
            if (indexMatch && currentTable) {
                const indexName = indexMatch[1];
                const indexCols = indexMatch[2];
                createdIndexes.push(`CREATE INDEX IF NOT EXISTS ${indexName} ON ${currentTable} (${indexCols});`);
                // Skip the inline INDEX line
                continue;
            }

            cleanSql += line + '\n';
        }

        let sqliteSql = cleanSql
            .replace(/CREATE DATABASE[^\n]+;/gi, '')
            .replace(/USE [^;]+;/gi, '')
            .replace(/ENGINE=InnoDB[^;]*/gi, '')
            .replace(/INT AUTO_INCREMENT PRIMARY KEY/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT')
            .replace(/ENUM\([^)]+\)/gi, 'TEXT')
            .replace(/TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP/gi, 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP')
            .replace(/DECIMAL\([^)]+\)/gi, 'REAL')
            // Remove any trailing commas before closing parenthesis
            .replace(/,(\s*\))/g, '$1');

        const statements = sqliteSql
            .replace(/--.*$/gm, '')
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        // Execute table creation statements
        for (const statement of statements) {
            try {
                await db.execute(statement);
            } catch (err) {
                if (!err.message.includes('already exists')) {
                    console.error(`[InitDB] SQLite Error on statement: ${statement.slice(0, 80)}...`, err.message);
                    throw err;
                }
            }
        }

        // Execute separated CREATE INDEX statements
        for (const idxStmt of createdIndexes) {
            try {
                await db.execute(idxStmt);
            } catch (err) {
                // ignore if exists
            }
        }
    }

    console.log('[InitDB] Schema created successfully.');
}

if (require.main === module) {
    initDb()
        .then(() => {
            console.log('[InitDB] Completed successfully.');
            process.exit(0);
        })
        .catch(err => {
            console.error('[InitDB] Failed:', err);
            process.exit(1);
        });
}

module.exports = initDb;
