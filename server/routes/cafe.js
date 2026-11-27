import {Router} from "express";
import pool from "../db.js";


const router = Router();


// cafe: shop info (name, address, tax rate, delivery fee...)
router.get("/info",async (req,res) => {
    const result = await pool.query("SELECT * FROM cafe_settings WHERE id = 1");
    res.json(result.rows[0]);
});


// cafe: opening hours for every day
router.get("/hours",async (req,res) => {
    const result = await pool.query("SELECT * FROM opening_hours ORDER BY day_of_week");
    res.json(result.rows);
});


// cafe: the menu categories
router.get("/categories",async (req,res) => {
    const result = await pool.query("SELECT * FROM categories ORDER BY sort_order");
    res.json(result.rows);
});


export default router;
