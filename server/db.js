import pg from "pg";
import "dotenv/config";


// NUMERIC (prices, totals) come back as text, so turn them into numbers
pg.types.setTypeParser(1700,parseFloat);

// DATE comes back as a JS Date (which can shift a day), so keep it as "2026-11-24"
pg.types.setTypeParser(1082,(value) => value);


const pool = new pg.Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});


export default pool;
