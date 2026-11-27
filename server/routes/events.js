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


// events: all event packages (everyone)
router.get("/",async (req,res) => {
    const result = await pool.query("SELECT * FROM events ORDER BY id");
    res.json(result.rows);
});


// events: add a package (admin)
router.post("/",needadmin,async (req,res) => {
    const b = req.body;
    if (sendproblems(res,checkevent(b))) return;

    const result = await pool.query(
        `INSERT INTO events (name,description,price_per_person,min_guests,max_guests,menus)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [b.name.trim(),b.description || "",b.price_per_person,b.min_guests,b.max_guests,b.menus]
    );
    res.status(201).json(result.rows[0]);
});


// events: edit a package (admin)
router.put("/:id",needadmin,async (req,res) => {
    const b = req.body;
    if (sendproblems(res,checkevent(b))) return;

    const result = await pool.query(
        `UPDATE events SET name = $1,description = $2,price_per_person = $3,min_guests = $4,max_guests = $5,menus = $6
         WHERE id = $7 RETURNING *`,
        [b.name.trim(),b.description || "",b.price_per_person,b.min_guests,b.max_guests,b.menus,req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({error: "Event not found."});
    res.json(result.rows[0]);
});


// events: delete a package (admin). not allowed while people have booked it
router.delete("/:id",needadmin,async (req,res) => {
    const booked = await pool.query("SELECT 1 FROM reservations WHERE event_id = $1 LIMIT 1",[req.params.id]);
    if (booked.rows.length) return res.status(409).json({error: "This event has bookings. Cancel them first."});

    const result = await pool.query("DELETE FROM events WHERE id = $1",[req.params.id]);
    if (!result.rowCount) return res.status(404).json({error: "Event not found."});
    res.json({ok: true});
});


export default router;
