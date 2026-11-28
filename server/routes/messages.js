import {Router} from "express";
import pool from "../db.js";
import {needadmin} from "../middleware/auth.js";
import {filled,isemail,sendproblems} from "../middleware/check.js";


const router = Router();

// one message by id, or undefined
const getmessage = async (id) => (await pool.query("SELECT * FROM contact_messages WHERE id = ?",[id]))[0][0];


// messages: send a message from the Contact page (everyone)
router.post("/",async (req,res) => {
    const {name,email,message} = req.body;

    const errors = {};
    if (!filled(name,2)) errors.name = "Please enter your name.";
    if (!isemail(email)) errors.email = "Please enter a valid email.";
    if (!filled(message,5)) errors.message = "Please write a short message.";
    if (sendproblems(res,errors)) return;

    const [result] = await pool.query(
        "INSERT INTO contact_messages (name,email,message) VALUES (?,?,?)",
        [name.trim(),email.trim(),message.trim()]
    );
    res.status(201).json(await getmessage(result.insertId));
});


// messages: read all messages (admin)
router.get("/",needadmin,async (req,res) => {
    const [rows] = await pool.query("SELECT * FROM contact_messages ORDER BY created_at DESC");
    res.json(rows);
});


// messages: mark as read / unread (admin)
router.patch("/:id",needadmin,async (req,res) => {
    if (!await getmessage(req.params.id)) return res.status(404).json({error: "Message not found."});
    await pool.query("UPDATE contact_messages SET is_read = ? WHERE id = ?",[!!req.body.is_read,req.params.id]);
    res.json(await getmessage(req.params.id));
});


export default router;
