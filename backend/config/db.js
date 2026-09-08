const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

let pool = null;
let sqliteDb = null;
let currentDialect = 'mysql';

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10);
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'college_db';
const SQLITE_PATH = process.env.SQLITE_DB_PATH
    ? path.resolve(__dirname, '..', process.env.SQLITE_DB_PATH)
    : path.resolve(__dirname, '../college_db.sqlite');

/**
 * Initialize SQLite connection and schema
 */
function initSqlite() {
    try {
        const Database = require('better-sqlite3');
        sqliteDb = new Database(SQLITE_PATH);
        sqliteDb.pragma('journal_mode = WAL');
        sqliteDb.pragma('foreign_keys = ON');
        currentDialect = 'sqlite';
        console.log(`[Database] Connected to SQLite database at ${SQLITE_PATH}`);
        return true;
    } catch (err) {
        console.error('[Database] Failed to initialize SQLite:', err.message);
        throw err;
    }
}

/**
 * Initialize MySQL Connection Pool
 */
async function initMySQL() {
    const mysql = require('mysql2/promise');

    // First try connecting to MySQL server to ensure DB exists
    try {
        const rootConn = await mysql.createConnection({
            host: DB_HOST,
            port: DB_PORT,
            user: DB_USER,
            password: DB_PASSWORD,
            multipleStatements: true,
            connectTimeout: 3000
        });

        await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
        await rootConn.end();

        pool = mysql.createPool({
            host: DB_HOST,
            port: DB_PORT,
            user: DB_USER,
            password: DB_PASSWORD,
            database: DB_NAME,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            multipleStatements: true
        });

        // Test connection
        const [rows] = await pool.query('SELECT 1 + 1 AS test');
        currentDialect = 'mysql';
        console.log(`[Database] Successfully connected to MySQL at ${DB_HOST}:${DB_PORT}/${DB_NAME}`);
        return true;
    } catch (err) {
        console.warn(`[Database] MySQL connection failed (${err.code || err.message}). Switching to SQLite fallback...`);
        return false;
    }
}

/**
 * Setup database connection
 */
async function connectDb() {
    const preferDialect = (process.env.DB_DIALECT || 'mysql').toLowerCase();

    if (preferDialect === 'mysql') {
        const mysqlSuccess = await initMySQL();
        if (!mysqlSuccess) {
            initSqlite();
        }
    } else {
        initSqlite();
    }
}

async function ensureConnected() {
    if (!pool && !sqliteDb) {
        await connectDb();
    }
}

/**
 * Standard query execution returning array of rows
 */
async function query(sql, params = []) {
    await ensureConnected();
    if (currentDialect === 'mysql') {
        const [rows] = await pool.query(sql, params);
        return rows;
    } else {
        const stmt = sqliteDb.prepare(sql);
        return stmt.all(params);
    }
}

/**
 * Single row helper
 */
async function getOne(sql, params = []) {
    const rows = await query(sql, params);
    return rows && rows.length > 0 ? rows[0] : null;
}

/**
 * Execute INSERT / UPDATE / DELETE returning standard { insertId, affectedRows }
 */
async function execute(sql, params = []) {
    await ensureConnected();
    if (currentDialect === 'mysql') {
        const [result] = await pool.execute(sql, params);
        return {
            insertId: result.insertId,
            affectedRows: result.affectedRows
        };
    } else {
        const stmt = sqliteDb.prepare(sql);
        const info = stmt.run(params);
        return {
            insertId: Number(info.lastInsertRowid),
            affectedRows: info.changes
        };
    }
}

/**
 * Transaction helper
 */
async function withTransaction(callback) {
    await ensureConnected();
    if (currentDialect === 'mysql') {
        const connection = await pool.getConnection();
        await connection.beginTransaction();
        try {
            const tx = {
                query: async (sql, params = []) => {
                    const [rows] = await connection.query(sql, params);
                    return rows;
                },
                execute: async (sql, params = []) => {
                    const [res] = await connection.execute(sql, params);
                    return { insertId: res.insertId, affectedRows: res.affectedRows };
                }
            };
            const result = await callback(tx);
            await connection.commit();
            return result;
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } else {
        await ensureConnected();
        sqliteDb.exec('BEGIN TRANSACTION');
        try {
            const tx = {
                query: async (sql, params = []) => sqliteDb.prepare(sql).all(params),
                execute: async (sql, params = []) => {
                    const info = sqliteDb.prepare(sql).run(params);
                    return { insertId: Number(info.lastInsertRowid), affectedRows: info.changes };
                }
            };
            const result = await callback(tx);
            sqliteDb.exec('COMMIT');
            return result;
        } catch (err) {
            sqliteDb.exec('ROLLBACK');
            throw err;
        }
    }
}

module.exports = {
    connectDb,
    query,
    getOne,
    execute,
    withTransaction,
    getDialect: () => currentDialect
};
