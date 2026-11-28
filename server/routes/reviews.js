import {Router} from "express";
import pool from "../db.js";
import {needlogin,needadmin} from "../middleware/auth.js";
import {filled,sendproblems} from "../middleware/check.js";


const router = Router();


// reviews: all reviews, newest first (everyone)
router.get("/",async (req,res) => {
    const [rows] = await pool.query("SELECT * FROM reviews ORDER BY created_at DESC");
    res.json(rows);
});


// reviews: leave a review (logged-in customers)
router.post("/",needlogin,async (req,res) => {
    const {rating,comment} = req.body;

    const errors = {};
    if (![1,2,3,4,5].includes(Number(rating))) errors.rating = "Choose 1 to 5 stars.";
    if (!filled(comment,5)) errors.comment = "Please write a short comment.";
    if (sendproblems(res,errors)) return;

    const [result] = await pool.query(
        "INSERT INTO reviews (user_id,name,rating,comment) VALUES (?,?,?,?)",
        [req.user.id,req.user.full_name,Number(rating),comment.trim()]
    );
    const [rows] = await pool.query("SELECT * FROM reviews WHERE id = ?",[result.insertId]);
    res.status(201).json(rows[0]);
});


// reviews: delete a review (admin)
router.delete("/:id",needadmin,async (req,res) => {
    const [result] = await pool.query("DELETE FROM reviews WHERE id = ?",[req.params.id]);
    if (!result.affectedRows) return res.status(404).json({error: "Review not found."});
    res.json({ok: true});
});


export default router;
