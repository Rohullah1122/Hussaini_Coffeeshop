import {Router} from "express";
import pool from "../db.js";
import {needadmin} from "../middleware/auth.js";
import {filled,isprice,iswhole,sendproblems} from "../middleware/check.js";


const router = Router();


const checkevent = (b) => {
    const errors = {};
    if (!filled(b.name,2)) errors.name = "Enter the event name.";
    if (!isprice(b.price_per_person)) errors.price_per_person = "Enter a valid price per person.";
    if (!iswhole(b.min_guests) || !iswhole(b.max_guests)) errors.guests = "Enter the minimum and maximum guests.";
    else if (Number(b.min_guests) > Number(b.max_guests)) errors.guests = "Minimum guests can't be more than maximum.";
    if (!Array.isArray(b.menus) || !b.menus.length) errors.menus = "Add at least one menu choice.";
    return errors;
};

// one event by id, or undefined
const getevent = async (id) => (await pool.query("SELECT * FROM events WHERE id = ?",[id]))[0][0];


// events: all event packages (everyone)
router.get("/",async (req,res) => {
    const [rows] = await pool.query("SELECT * FROM events ORDER BY id");
    res.json(rows);
});


// events: add a package (admin)
router.post("/",needadmin,async (req,res) => {
    const b = req.body;
    if (sendproblems(res,checkevent(b))) return;

    // menus is a JSON column, so the list is sent as JSON text
    const [result] = await pool.query(
        `INSERT INTO events (name,description,price_per_person,min_guests,max_guests,menus)
         VALUES (?,?,?,?,?,?)`,
        [b.name.trim(),b.description || "",b.price_per_person,b.min_guests,b.max_guests,JSON.stringify(b.menus)]
    );
    res.status(201).json(await getevent(result.insertId));
});


// events: edit a package (admin)
router.put("/:id",needadmin,async (req,res) => {
    const b = req.body;
    if (sendproblems(res,checkevent(b))) return;
    if (!await getevent(req.params.id)) return res.status(404).json({error: "Event not found."});

    await pool.query(
        `UPDATE events SET name = ?,description = ?,price_per_person = ?,min_guests = ?,max_guests = ?,menus = ?
         WHERE id = ?`,
        [b.name.trim(),b.description || "",b.price_per_person,b.min_guests,b.max_guests,JSON.stringify(b.menus),req.params.id]
    );
    res.json(await getevent(req.params.id));
});


// events: delete a package (admin). not allowed while people have booked it
router.delete("/:id",needadmin,async (req,res) => {
    const [booked] = await pool.query("SELECT 1 FROM reservations WHERE event_id = ? LIMIT 1",[req.params.id]);
    if (booked.length) return res.status(409).json({error: "This event has bookings. Cancel them first."});

    const [result] = await pool.query("DELETE FROM events WHERE id = ?",[req.params.id]);
    if (!result.affectedRows) return res.status(404).json({error: "Event not found."});
    res.json({ok: true});
});


export default router;
