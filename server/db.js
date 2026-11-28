import mysql from "mysql2/promise";
import "dotenv/config";


// a pool keeps a few connections open and reuses them, so every request doesn't reconnect
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,

    // DECIMAL (prices, totals) come back as numbers instead of text
    decimalNumbers: true,

    // DATE comes back as "2026-11-24" instead of a JS Date (which can shift a day)
    dateStrings: ["DATE"],

    // MySQL has no real true/false: BOOLEAN is TINYINT(1), so turn 1/0 back into true/false
    typeCast: (field,next) => {
        if (field.type === "TINY" && field.length === 1) {
            const value = field.string();
            return value === null ? null : value === "1";
        }
        return next();
    }
});


export default pool;
