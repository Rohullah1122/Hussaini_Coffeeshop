import {Router} from "express";
import pool from "../db.js";
import {needadmin} from "../middleware/auth.js";
import {filled,isemail,sendproblems} from "../middleware/check.js";


const router = Router();


// messages: send a message from the Contact page (everyone)
router.post("/",async (req,res) => {
    const {name,email,message} = req.body;

    const errors = {};
    if (!filled(name,2)) errors.name = "Please enter your name.";
    if (!isemail(email)) errors.email = "Please enter a valid email.";
    if (!filled(message,5)) errors.message = "Please write a short message.";
    if (sendproblems(res,errors)) return;

    const result = await pool.query(
        "INSERT INTO contact_messages (name,email,message) VALUES ($1,$2,$3) RETURNING *",
        [name.trim(),email.trim(),message.trim()]
    );
    res.status(201).json(result.rows[0]);
});


// messages: read all messages (admin)
router.get("/",needadmin,async (req,res) => {
    const result = await pool.query("SELECT * FROM contact_messages ORDER BY created_at DESC");
    res.json(result.rows);
});


// messages: mark as read / unread (admin)
router.patch("/:id",needadmin,async (req,res) => {
    const result = await pool.query(
        "UPDATE contact_messages SET is_read = $1 WHERE id = $2 RETURNING *",
        [!!req.body.is_read,req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({error: "Message not found."});
    res.json(result.rows[0]);
});


export default router;
