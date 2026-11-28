import {Router} from "express";
import pool from "../db.js";
import {needadmin} from "../middleware/auth.js";


const router = Router();


// admin dashboard: all the numbers for the dashboard page in one request (admin)
// MySQL has no COUNT(*) FILTER (WHERE ...), so SUM(condition) counts the rows where it's true (true = 1)
router.get("/stats",needadmin,async (req,res) => {
    const [totals] = await pool.query(`
        SELECT
            COALESCE(SUM(DATE(created_at) = CURDATE() AND status <> 'cancelled'),0) AS orders_today,
            COALESCE(SUM(CASE WHEN created_at >= CURDATE() - INTERVAL 6 DAY AND status <> 'cancelled' THEN total END),0) AS sales_week,
            COALESCE(SUM(status IN ('pending','preparing','ready')),0) AS open_orders
        FROM orders
    `);

    // orders per day for the last 7 days (days with 0 orders included)
    // MySQL has no generate_series, so a recursive query makes the 7 days
    const [perday] = await pool.query(`
        WITH RECURSIVE days AS (
            SELECT CURDATE() - INTERVAL 6 DAY AS day
            UNION ALL
            SELECT day + INTERVAL 1 DAY FROM days WHERE day < CURDATE()
        )
        SELECT days.day,COUNT(o.id) AS orders
        FROM days
        LEFT JOIN orders o ON DATE(o.created_at) = days.day AND o.status <> 'cancelled'
        GROUP BY days.day ORDER BY days.day
    `);

    // the 5 items sold the most
    const [popular] = await pool.query(`
        SELECT i.item_name,SUM(i.quantity) AS sold
        FROM order_items i JOIN orders o ON o.id = i.order_id
        WHERE o.status <> 'cancelled'
        GROUP BY i.item_name ORDER BY sold DESC LIMIT 5
    `);

    const [bookings] = await pool.query(`
        SELECT COALESCE(SUM(reservation_date >= CURDATE() AND status IN ('pending','confirmed')),0) AS upcoming,
               COALESCE(SUM(status = 'pending'),0) AS waiting
        FROM reservations
    `);

    const [reviews] = await pool.query("SELECT COUNT(*) AS count,ROUND(AVG(rating),1) AS average FROM reviews");

    res.json({
        ...totals[0],
        orders_per_day: perday,
        popular_items: popular,
        bookings: bookings[0],
        reviews: reviews[0]
    });
});


export default router;
