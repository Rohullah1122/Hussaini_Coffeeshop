import {useState} from "react";
import {Link} from "react-router-dom";
import cafe from "../data/cafe.json";
import {adddays,hoursfor,prettydate,prettytime,timeslots,today} from "../js/helpers.js";
import "../styles/reservation.css";


const Reservation = ({user,ALreservations,addreservation}) => {
    const [form,setform] = useState({
        full_name: user ? user.full_name : "",
        email: user ? user.email : "",
        phone: user ? user.phone || "" : "",
        reservation_date: today(),
        reservation_time: "",
        guests: 2,
        notes: ""
    });
    const [errors,seterrors] = useState({});
    const [booked,setbooked] = useState(null);


    const set = (key) => (e) => setform({...form,[key]: e.target.value});


    // a slot is full when every table is already booked at that time
    const tablesleft = (date,time) => {
        const taken = ALreservations.filter((r) =>
            r.booking_type === "table" && r.status !== "cancelled" && r.reservation_date === date && r.reservation_time === time
        ).length;
        return cafe.tables - taken;
    };


    const now = new Date();
    const nowtime = String(now.getHours()).padStart(2,"0") + ":" + String(now.getMinutes()).padStart(2,"0");
    const ALslots = timeslots(form.reservation_date).filter((t) => form.reservation_date !== today() || t > nowtime);


    const book = (e) => {
        e.preventDefault();

        const ALerrors = {};
        const guests = Number(form.guests);

        if (form.full_name.trim().length < 2) ALerrors.full_name = "Please enter your name.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) ALerrors.email = "Please enter a valid email.";
        if (!/^[0-9()+\-\s]{10,}$/.test(form.phone.trim())) ALerrors.phone = "Please enter a valid phone number.";
        if (!form.reservation_date || form.reservation_date < today()) ALerrors.reservation_date = "Please pick today or a later date.";
        else if (!hoursfor(form.reservation_date)) ALerrors.reservation_date = "We're closed that day.";
        if (!form.reservation_time) ALerrors.reservation_time = "Please pick a time.";
        else if (!ALslots.includes(form.reservation_time)) ALerrors.reservation_time = "That time is outside our opening hours.";
        else if (tablesleft(form.reservation_date,form.reservation_time) < 1) ALerrors.reservation_time = "Sorry, every table is booked at that time. Please pick another time.";
        if (!guests || guests < 1 || guests > cafe.max_table_guests) ALerrors.guests = "Tables are for 1 to " + cafe.max_table_guests + " guests. For bigger groups, book an event.";

        const doublebooked = ALreservations.some((r) =>
            r.status !== "cancelled" && r.email.toLowerCase() === form.email.trim().toLowerCase() &&
            r.reservation_date === form.reservation_date && r.reservation_time === form.reservation_time
        );
        if (doublebooked) ALerrors.reservation_time = "You already have a booking at this date and time.";

        seterrors(ALerrors);
        if (Object.keys(ALerrors).length) return;

        setbooked(addreservation({
            booking_type: "table",
            event_type: null,
            full_name: form.full_name.trim(),
            email: form.email.trim().toLowerCase(),
            phone: form.phone.trim(),
            reservation_date: form.reservation_date,
            reservation_time: form.reservation_time,
            guests,
            notes: form.notes.trim()
        }));
    };


    if (booked) {
        return (
            <section className="container section narrow">
                <div className="card confirm">
                    <div className="checkmark" aria-hidden="true">✓</div>
                    <span className="eyebrow">Reservation #{booked.id}</span>
                    <h1>Your table request is in!</h1>
                    <p className="muted">
                        {booked.guests} {booked.guests === 1 ? "guest" : "guests"} · {prettydate(booked.reservation_date)} at {prettytime(booked.reservation_time)}.
                        We'll confirm it shortly. A confirmation was sent to {booked.email} (simulated).
                    </p>
                    <div className="buttons center">
                        <button className="btn outline" onClick={() => setbooked(null)}>Book another</button>
                        <Link to="/account" className="btn">See my reservations</Link>
                    </div>
                </div>
            </section>
        );
    }


    return (
        <section className="container section">
            <div className="pagehead">
                <span className="eyebrow">Reservations</span>
                <h1>Book a table</h1>
                <p className="muted">Tables for 1 to {cafe.max_table_guests} guests. Bigger group? <Link to="/events">Book an event</Link>.</p>
            </div>

            <form className="card bookform" onSubmit={book} noValidate>
                <div className="formgrid">
                    <label className="field">Date
                        <input type="date" min={today()} max={adddays(today(),60)} value={form.reservation_date}
                            onChange={(e) => setform({...form,reservation_date: e.target.value,reservation_time: ""})} />
                        {errors.reservation_date && <span className="error">{errors.reservation_date}</span>}
                    </label>

                    <label className="field">Guests
                        <input type="number" min="1" max={cafe.max_table_guests} value={form.guests} onChange={set("guests")} />
                        {errors.guests && <span className="error">{errors.guests}</span>}
                    </label>
                </div>

                <fieldset className="field slots">
                    <legend>Time</legend>
                    {ALslots.length === 0 && <p className="muted">No times left on this day. Please pick another date.</p>}
                    <div className="slotgrid">
                        {ALslots.map((t) => {
                            const left = tablesleft(form.reservation_date,t);
                            return (
                                <button type="button" key={t} disabled={left < 1}
                                    className={form.reservation_time === t ? "slot active" : "slot"}
                                    onClick={() => setform({...form,reservation_time: t})}
                                    aria-pressed={form.reservation_time === t}>
                                    {prettytime(t)}
                                    {left < 1 && <small>Full</small>}
                                </button>
                            );
                        })}
                    </div>
                    {errors.reservation_time && <span className="error">{errors.reservation_time}</span>}
                </fieldset>

                <div className="formgrid">
                    <label className="field">Name
                        <input value={form.full_name} onChange={set("full_name")} autoComplete="name" />
                        {errors.full_name && <span className="error">{errors.full_name}</span>}
                    </label>
                    <label className="field">Email
                        <input type="email" value={form.email} onChange={set("email")} autoComplete="email" />
                        {errors.email && <span className="error">{errors.email}</span>}
                    </label>
                    <label className="field">Phone
                        <input value={form.phone} onChange={set("phone")} autoComplete="tel" />
                        {errors.phone && <span className="error">{errors.phone}</span>}
                    </label>
                </div>

                <label className="field">Notes (optional)
                    <textarea rows="2" value={form.notes} onChange={set("notes")} placeholder="Window seat, high chair, allergies..." />
                </label>

                <button className="btn">Request table</button>
            </form>
        </section>
    );
};

export default Reservation;
