import {Router} from "express";
import bcrypt from "bcryptjs";
import pool from "../db.js";
import {needlogin,needadmin} from "../middleware/auth.js";
import {filled,isemail,sendproblems} from "../middleware/check.js";


const router = Router();

const USERFIELDS = "id,full_name,email,phone,role,preferences,created_at";

// customers can only touch their own account, admins can touch any
const isselforadmin = (req) => req.user.role === "admin" || req.user.id === Number(req.params.id);


// users: list every account with how many orders and how much they spent (admin)
router.get("/",needadmin,async (req,res) => {
    const result = await pool.query(
        `SELECT u.id,u.full_name,u.email,u.phone,u.role,u.preferences,u.created_at,
                COUNT(o.id)::int AS order_count,
                COALESCE(SUM(o.total) FILTER (WHERE o.status <> 'cancelled'),0) AS total_spent
         FROM users u LEFT JOIN orders o ON o.user_id = u.id
         GROUP BY u.id ORDER BY u.id`
    );
    res.json(result.rows);
});


// users: one account (yourself, or admin)
router.get("/:id",needlogin,async (req,res) => {
    if (!isselforadmin(req)) return res.status(403).json({error: "You can only see your own account."});
    const result = await pool.query(`SELECT ${USERFIELDS} FROM users WHERE id = $1`,[req.params.id]);
    if (!result.rows.length) return res.status(404).json({error: "User not found."});
    res.json(result.rows[0]);
});


// users: update name, phone, preferences or password (yourself, or admin)
router.put("/:id",needlogin,async (req,res) => {
    if (!isselforadmin(req)) return res.status(403).json({error: "You can only change your own account."});
    const {full_name,email,phone,preferences,password} = req.body;

    const errors = {};
    if (full_name !== undefined && !filled(full_name,2)) errors.full_name = "Please enter your full name.";
    if (email !== undefined && !isemail(email)) errors.email = "Please enter a valid email.";
    if (password !== undefined && !filled(password,6)) errors.password = "The password needs at least 6 characters.";
    if (sendproblems(res,errors)) return;

    // COALESCE keeps the old value when a field wasn't sent
    const result = await pool.query(
        `UPDATE users SET full_name = COALESCE($1,full_name),email = COALESCE($2,email),phone = COALESCE($3,phone),
            preferences = COALESCE($4,preferences),password_hash = COALESCE($5,password_hash)
         WHERE id = $6 RETURNING ${USERFIELDS}`,
        [full_name ? full_name.trim() : null,email ? email.trim().toLowerCase() : null,phone ?? null,
         preferences ?? null,password ? await bcrypt.hash(password,10) : null,req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({error: "User not found."});
    res.json(result.rows[0]);
});


// users: make someone a customer or an admin (admin)
router.patch("/:id/role",needadmin,async (req,res) => {
    const {role} = req.body;
    if (!["customer","admin"].includes(role)) return res.status(400).json({error: "Role must be customer or admin."});
    if (Number(req.params.id) === req.user.id) return res.status(400).json({error: "You can't change your own role."});

    const result = await pool.query(`UPDATE users SET role = $1 WHERE id = $2 RETURNING ${USERFIELDS}`,[role,req.params.id]);
    if (!result.rows.length) return res.status(404).json({error: "User not found."});
    res.json(result.rows[0]);
});


// users: delete an account (yourself, or admin). their old orders stay, without the link
router.delete("/:id",needlogin,async (req,res) => {
    if (!isselforadmin(req)) return res.status(403).json({error: "You can only delete your own account."});
    if (req.user.role === "admin" && Number(req.params.id) === req.user.id) return res.status(400).json({error: "Admins can't delete their own account here."});

    const result = await pool.query("DELETE FROM users WHERE id = $1",[req.params.id]);
    if (!result.rowCount) return res.status(404).json({error: "User not found."});
    res.json({ok: true});
});


export default router;
