import {Router} from "express";
import bcrypt from "bcryptjs";
import pool from "../db.js";
import {maketoken,needlogin} from "../middleware/auth.js";
import {isemail,filled,sendproblems} from "../middleware/check.js";


const router = Router();

// what we send back about a user (never the password hash)
const USERFIELDS = "id,full_name,email,phone,role,preferences,created_at";


// register: create a customer account and log them in
router.post("/register",async (req,res) => {
    const {full_name,email,password,phone} = req.body;

    const errors = {};
    if (!filled(full_name,2)) errors.full_name = "Please enter your full name.";
    if (!isemail(email)) errors.email = "Please enter a valid email.";
    if (!filled(password,6)) errors.password = "The password needs at least 6 characters.";
    if (sendproblems(res,errors)) return;

    const hash = await bcrypt.hash(password,10);

    // JSON columns get JSON text: JSON.stringify turns the object into '{"favorite":"",...}'
    const [result] = await pool.query(
        `INSERT INTO users (full_name,email,password_hash,phone,role,preferences)
         VALUES (?,?,?,?,'customer',?)`,
        [full_name.trim(),email.trim().toLowerCase(),hash,phone || null,JSON.stringify({favorite: "",milk: "Regular milk"})]
    );

    // MySQL has no RETURNING, so read the new user back with the id MySQL just made
    const [rows] = await pool.query(`SELECT ${USERFIELDS} FROM users WHERE id = ?`,[result.insertId]);
    const user = rows[0];
    res.status(201).json({token: maketoken(user),user});
});


// login: customers and admins use the same route, the role decides what they can do
router.post("/login",async (req,res) => {
    const {email,password} = req.body;
    if (!email || !password) return res.status(400).json({error: "Enter your email and password."});

    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?",[email.trim().toLowerCase()]);
    const found = rows[0];

    if (!found || !await bcrypt.compare(password,found.password_hash)) {
        return res.status(401).json({error: "Wrong email or password."});
    }

    const {password_hash,...user} = found;
    res.json({token: maketoken(user),user});
});


// me: who is logged in (the React app calls this when it opens to restore the session)
router.get("/me",needlogin,async (req,res) => {
    const [rows] = await pool.query(`SELECT ${USERFIELDS} FROM users WHERE id = ?`,[req.user.id]);
    if (!rows.length) return res.status(404).json({error: "Account not found."});
    res.json(rows[0]);
});


export default router;
