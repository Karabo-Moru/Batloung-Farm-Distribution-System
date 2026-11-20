
const mysql = require('mysql2/promise');
require('dotenv').config();

let db;

if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
    const databaseUrl = new URL(process.env.DATABASE_URL);

    db = mysql.createPool({
        host: databaseUrl.hostname,
        port: Number(databaseUrl.port || 3306),
        user: decodeURIComponent(databaseUrl.username),
        password: decodeURIComponent(databaseUrl.password),
        database: databaseUrl.pathname.replace(/^\//, ''),
        ssl: {},
        waitForConnections: true,
        connectionLimit: 5,
        queueLimit: 0
    });
} else {
    db = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: Number(process.env.DB_PORT || 3306),
        waitForConnections: true,
        connectionLimit: 5,
        queueLimit: 0
    });
}

module.exports = db;
