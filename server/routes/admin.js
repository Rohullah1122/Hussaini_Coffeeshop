import {Router} from "express";
import pool from "../db.js";
import {needadmin} from "../middleware/auth.js";


const router = Router();


// admin dashboard: all the numbers for the dashboard page in one request (admin)
router.get("/stats",needadmin,async (req,res) => {
    const totals = await pool.query(`
        SELECT
            COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE AND status <> 'cancelled')::int AS orders_today,
            COALESCE(SUM(total) FILTER (WHERE created_at >= CURRENT_DATE - 6 AND status <> 'cancelled'),0) AS sales_week,
            COUNT(*) FILTER (WHERE status IN ('pending','preparing','ready'))::int AS open_orders
        FROM orders
    `);

    // orders per day for the last 7 days (days with 0 orders included)
    const perday = await pool.query(`
        SELECT d::date AS day,COUNT(o.id)::int AS orders
        FROM generate_series(CURRENT_DATE - 6,CURRENT_DATE,'1 day') d
        LEFT JOIN orders o ON o.created_at::date = d::date AND o.status <> 'cancelled'
        GROUP BY d ORDER BY d
    `);

    // the 5 items sold the most
    const popular = await pool.query(`
        SELECT i.item_name,SUM(i.quantity)::int AS sold
        FROM order_items i JOIN orders o ON o.id = i.order_id
        WHERE o.status <> 'cancelled'
        GROUP BY i.item_name ORDER BY sold DESC LIMIT 5
    `);

    const bookings = await pool.query(`
        SELECT COUNT(*) FILTER (WHERE reservation_date >= CURRENT_DATE AND status IN ('pending','confirmed'))::int AS upcoming,
               COUNT(*) FILTER (WHERE status = 'pending')::int AS waiting
        FROM reservations
    `);

    const reviews = await pool.query("SELECT COUNT(*)::int AS count,ROUND(AVG(rating),1)::float AS average FROM reviews");

    res.json({
        ...totals.rows[0],
        orders_per_day: perday.rows,
        popular_items: popular.rows,
        bookings: bookings.rows[0],
        reviews: reviews.rows[0]
    });
});


export default router;
