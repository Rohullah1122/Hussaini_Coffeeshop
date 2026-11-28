import {Router} from "express";
import pool from "../db.js";
import {maybelogin,needlogin,needadmin} from "../middleware/auth.js";
import {filled,isemail,isdate,istime,iswhole,sendproblems} from "../middleware/check.js";


const router = Router();

const STATUSES = ["pending","confirmed","completed","cancelled"];


// how many tables are still free at this date and time (ignoreid = the booking being edited)
const tablesleft = async (date,time,ignoreid = 0) => {
    // `tables` is a reserved word in MySQL, so it needs backticks
    const cafe = (await pool.query("SELECT `tables` FROM cafe_settings WHERE id = 1"))[0][0];
    const [taken] = await pool.query(
        `SELECT COUNT(*) AS n FROM reservations
         WHERE booking_type = 'table' AND status <> 'cancelled'
           AND reservation_date = ? AND reservation_time = ? AND id <> ?`,
        [date,time,ignoreid]
    );
    return cafe.tables - taken[0].n;
};


// all the booking rules in one place. returns {status,error} when something is wrong, or the extra values to save
const checkbooking = async (b,ignoreid = 0) => {
    const errors = {};
    if (!["table","event"].includes(b.booking_type)) errors.booking_type = "Choose a table or an event.";
    if (!filled(b.full_name,2)) errors.full_name = "Please enter your name.";
    if (!isemail(b.email)) errors.email = "Please enter a valid email.";
    if (!filled(b.phone,7)) errors.phone = "Please enter a phone number.";
    if (!isdate(b.reservation_date)) errors.reservation_date = "Choose a date.";
    if (!istime(b.reservation_time)) errors.reservation_time = "Choose a time.";
    if (!iswhole(b.guests)) errors.guests = "Enter the number of guests.";
    if (Object.keys(errors).length) return {status: 400,error: Object.values(errors)[0],errors};

    // no bookings in the past, and only while the cafe is open.
    // MySQL has no $1 that can be reused, so each ? gets its own value (date and time are sent more than once).
    // DAYOFWEEK gives 1 = Sunday, so -1 makes it 0 = Sunday like the opening_hours table
    const day = (await pool.query(
        `SELECT TIMESTAMP(?,?) <= NOW() AS past,
                DATEDIFF(?,CURDATE()) AS daysaway,
                h.open_time,h.close_time,(CAST(? AS TIME) >= h.open_time AND CAST(? AS TIME) < h.close_time) AS isopen
         FROM opening_hours h WHERE h.day_of_week = DAYOFWEEK(?) - 1`,
        [b.reservation_date,b.reservation_time,b.reservation_date,b.reservation_time,b.reservation_time,b.reservation_date]
    ))[0][0];

    if (day.past) return {status: 400,error: "That date and time has already passed."};
    if (!day.open_time) return {status: 400,error: "We're closed that day."};
    if (!day.isopen) return {status: 400,error: `We're open ${day.open_time.slice(0,5)} to ${day.close_time.slice(0,5)} that day.`};

    if (b.booking_type === "table") {
        const cafe = (await pool.query("SELECT max_table_guests FROM cafe_settings WHERE id = 1"))[0][0];
        if (Number(b.guests) > cafe.max_table_guests) return {status: 400,error: `A table seats up to ${cafe.max_table_guests} guests. Book an event for bigger groups.`};

        // no double booking: only so many tables per time slot
        if (await tablesleft(b.reservation_date,b.reservation_time,ignoreid) <= 0) {
            return {status: 409,error: "All tables are booked at that time. Please pick another time."};
        }
        return {event_id: null,menu: null,estimated_total: null};
    }

    // event booking
    const ev = (await pool.query("SELECT * FROM events WHERE id = ?",[b.event_id]))[0][0];
    if (!ev) return {status: 400,error: "Choose an event."};
    if (Number(b.guests) < ev.min_guests || Number(b.guests) > ev.max_guests) {
        return {status: 400,error: `${ev.name} is for ${ev.min_guests} to ${ev.max_guests} guests.`};
    }
    if (!ev.menus.includes(b.menu)) return {status: 400,error: "Choose one of the event menus."};
    if (day.daysaway < 3) return {status: 400,error: "Events need at least 3 days' notice."};

    // the event room: one event per day
    const [sameday] = await pool.query(
        `SELECT 1 FROM reservations WHERE booking_type = 'event' AND status <> 'cancelled'
           AND reservation_date = ? AND id <> ? LIMIT 1`,
        [b.reservation_date,ignoreid]
    );
    if (sameday.length) return {status: 409,error: "The event room is already booked that day. Please pick another date."};

    return {event_id: ev.id,menu: b.menu,estimated_total: ev.price_per_person * Number(b.guests)};
};

// admins see every booking, customers only their own, guests only guest bookings
const cansee = (user,booking) => (user && user.role === "admin") || (user ? booking.user_id === user.id : booking.user_id === null);

const getbooking = async (id) => (await pool.query(
    `SELECT r.*,e.name AS event_type FROM reservations r LEFT JOIN events e ON e.id = r.event_id WHERE r.id = ?`,[id]
))[0][0];


// reservations: how many tables are free at a date and time (everyone, for the booking form)
router.get("/availability",async (req,res) => {
    const {date,time} = req.query;
    if (!isdate(date) || !istime(time)) return res.status(400).json({error: "Send ?date=YYYY-MM-DD&time=HH:MM"});
    res.json({date,time,tablesleft: Math.max(0,await tablesleft(date,time))});
});


// reservations: book a table or an event (customers and guests)
router.post("/",maybelogin,async (req,res) => {
    const b = req.body;
    const checked = await checkbooking(b);
    if (checked.error) return res.status(checked.status).json({error: checked.error,errors: checked.errors});

    const [result] = await pool.query(
        `INSERT INTO reservations (user_id,booking_type,event_id,menu,estimated_total,full_name,email,phone,
            reservation_date,reservation_time,guests,notes)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        [req.user ? req.user.id : null,b.booking_type,checked.event_id,checked.menu,checked.estimated_total,
         b.full_name.trim(),b.email.trim().toLowerCase(),b.phone.trim(),b.reservation_date,b.reservation_time,
         Number(b.guests),b.notes || ""]
    );
    res.status(201).json(await getbooking(result.insertId)); // insertId = the id MySQL just made
});


// reservations: list (admin sees all, a customer sees only their own)
router.get("/",needlogin,async (req,res) => {
    const isadmin = req.user.role === "admin";
    const [rows] = await pool.query(
        `SELECT r.*,e.name AS event_type FROM reservations r LEFT JOIN events e ON e.id = r.event_id
         ${isadmin ? "" : "WHERE r.user_id = ?"}
         ORDER BY r.reservation_date,r.reservation_time`,
        isadmin ? [] : [req.user.id]
    );
    res.json(rows);
});


// reservations: one booking
router.get("/:id",maybelogin,async (req,res) => {
    const booking = await getbooking(req.params.id);
    if (!booking || !cansee(req.user,booking)) return res.status(404).json({error: "Booking not found."});
    res.json(booking);
});


// reservations: change date, time, guests or notes (owner or admin). the rules are checked again
router.put("/:id",needlogin,async (req,res) => {
    const booking = await getbooking(req.params.id);
    if (!booking || (booking.user_id !== req.user.id && req.user.role !== "admin")) return res.status(404).json({error: "Booking not found."});
    if (["cancelled","completed"].includes(booking.status)) return res.status(409).json({error: "This booking can't be changed anymore."});

    // start from the saved booking and apply only what was sent
    const b = {...booking,...req.body,booking_type: booking.booking_type};
    b.reservation_time = String(b.reservation_time).slice(0,5);

    const checked = await checkbooking(b,booking.id);
    if (checked.error) return res.status(checked.status).json({error: checked.error,errors: checked.errors});

    // a customer's change needs the admin to confirm it again
    const status = req.user.role === "admin" ? booking.status : "pending";

    await pool.query(
        `UPDATE reservations SET event_id = ?,menu = ?,estimated_total = ?,full_name = ?,email = ?,phone = ?,
            reservation_date = ?,reservation_time = ?,guests = ?,notes = ?,status = ?
         WHERE id = ?`,
        [checked.event_id,checked.menu,checked.estimated_total,b.full_name.trim(),b.email.trim().toLowerCase(),b.phone.trim(),
         b.reservation_date,b.reservation_time,Number(b.guests),b.notes || "",status,booking.id]
    );
    res.json(await getbooking(booking.id));
});


// reservations: customer cancels their own booking
router.patch("/:id/cancel",needlogin,async (req,res) => {
    const booking = await getbooking(req.params.id);
    if (!booking || (booking.user_id !== req.user.id && req.user.role !== "admin")) return res.status(404).json({error: "Booking not found."});
    if (booking.status === "completed") return res.status(409).json({error: "This booking is already completed."});

    await pool.query("UPDATE reservations SET status = 'cancelled' WHERE id = ?",[booking.id]);
    res.json(await getbooking(booking.id));
});


// reservations: admin approves, completes or cancels a booking
router.patch("/:id/status",needadmin,async (req,res) => {
    const {status} = req.body;
    if (!STATUSES.includes(status)) return res.status(400).json({error: "Unknown status."});

    if (!await getbooking(req.params.id)) return res.status(404).json({error: "Booking not found."});
    await pool.query("UPDATE reservations SET status = ? WHERE id = ?",[status,req.params.id]);
    res.json(await getbooking(req.params.id));
});


export default router;
