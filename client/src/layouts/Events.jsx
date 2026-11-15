import {useState} from "react";
import {Link} from "react-router-dom";
import ALevents from "../data/events.json";
import {adddays,hoursfor,money,prettydate,prettytime,timeslots,today} from "../js/helpers.js";
import "../styles/reservation.css";


const Events = ({user,ALreservations,addreservation}) => {
    const [form,setform] = useState({
        event_id: ALevents[0].id,
        menu: ALevents[0].menus[0],
        reservation_date: adddays(today(),7),
        reservation_time: "",
        guests: ALevents[0].min_guests,
        full_name: user ? user.full_name : "",
        email: user ? user.email : "",
        phone: user ? user.phone || "" : "",
        notes: ""
    });
    const [errors,seterrors] = useState({});
    const [booked,setbooked] = useState(null);


    const event = ALevents.find((e) => e.id === Number(form.event_id));
    const ALslots = timeslots(form.reservation_date);
    const mindate = adddays(today(),3);

    const set = (key) => (e) => setform({...form,[key]: e.target.value});

    const pickevent = (ev) => setform({...form,event_id: ev.id,menu: ev.menus[0],guests: ev.min_guests});

    // the back room holds one event per day
    const daytaken = (date) => ALreservations.some((r) => r.booking_type === "event" && r.status !== "cancelled" && r.reservation_date === date);


    const book = (e) => {
        e.preventDefault();

        const ALerrors = {};
        const guests = Number(form.guests);

        if (!form.reservation_date || form.reservation_date < mindate) ALerrors.reservation_date = "Events need at least 3 days' notice.";
        else if (!hoursfor(form.reservation_date)) ALerrors.reservation_date = "We're closed that day.";
        else if (daytaken(form.reservation_date)) ALerrors.reservation_date = "The event room is already booked that day. Please pick another date.";
        if (!form.reservation_time) ALerrors.reservation_time = "Please pick a start time.";
        if (!guests || guests < event.min_guests || guests > event.max_guests) ALerrors.guests = event.name + " is for " + event.min_guests + " to " + event.max_guests + " guests.";
        if (form.full_name.trim().length < 2) ALerrors.full_name = "Please enter your name.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) ALerrors.email = "Please enter a valid email.";
        if (!/^[0-9()+\-\s]{10,}$/.test(form.phone.trim())) ALerrors.phone = "Please enter a valid phone number.";

        seterrors(ALerrors);
        if (Object.keys(ALerrors).length) return;

        setbooked(addreservation({
            booking_type: "event",
            event_type: event.name,
            menu: form.menu,
            estimated_total: guests * event.price_per_person,
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
                    <span className="eyebrow">Event request #{booked.id}</span>
                    <h1>{booked.event_type} requested!</h1>
                    <p className="muted">
                        {booked.guests} guests · {prettydate(booked.reservation_date)} at {prettytime(booked.reservation_time)} · {booked.menu}.
                        Estimated total {money(booked.estimated_total)}. Our team will contact you to confirm.
                    </p>
                    <div className="buttons center">
                        <button className="btn outline" onClick={() => setbooked(null)}>Plan another</button>
                        <Link to="/account" className="btn">See my bookings</Link>
                    </div>
                </div>
            </section>
        );
    }


    return (
        <section className="container section">
            <div className="pagehead">
                <span className="eyebrow">Private events</span>
                <h1>Celebrate at Hussaini's</h1>
                <p className="muted">Our back room hosts one event a day, for up to 30 guests.</p>
            </div>

            <div className="eventgrid">
                {ALevents.map((ev) =>
                    <button key={ev.id} type="button" className={event.id === ev.id ? "eventcard active" : "eventcard"} onClick={() => pickevent(ev)} aria-pressed={event.id === ev.id}>
                        <h3>{ev.name}</h3>
                        <p className="muted">{ev.description}</p>
                        <span className="eventmeta">{money(ev.price_per_person)} / person · {ev.min_guests}–{ev.max_guests} guests</span>
                    </button>
                )}
            </div>

            <form className="card bookform" onSubmit={book} noValidate>
                <h2>Book a {event.name}</h2>

                <div className="formgrid">
                    <label className="field">Date
                        <input type="date" min={mindate} max={adddays(today(),180)} value={form.reservation_date}
                            onChange={(e) => setform({...form,reservation_date: e.target.value,reservation_time: ""})} />
                        {errors.reservation_date && <span className="error">{errors.reservation_date}</span>}
                        {!errors.reservation_date && daytaken(form.reservation_date) && <span className="error">Already booked that day.</span>}
                    </label>

                    <label className="field">Start time
                        <select value={form.reservation_time} onChange={set("reservation_time")}>
                            <option value="">Choose a time</option>
                            {ALslots.map((t) => <option key={t} value={t}>{prettytime(t)}</option>)}
                        </select>
                        {errors.reservation_time && <span className="error">{errors.reservation_time}</span>}
                    </label>

                    <label className="field">Guests
                        <input type="number" min={event.min_guests} max={event.max_guests} value={form.guests} onChange={set("guests")} />
                        {errors.guests && <span className="error">{errors.guests}</span>}
                    </label>

                    <label className="field">Menu
                        <select value={form.menu} onChange={set("menu")}>
                            {event.menus.map((m) => <option key={m}>{m}</option>)}
                        </select>
                    </label>
                </div>

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

                <label className="field">Anything else? (optional)
                    <textarea rows="3" value={form.notes} onChange={set("notes")} placeholder="Decorations, allergies, a cake, a projector..." />
                </label>

                <div className="estimate">
                    <span>Estimated total</span>
                    <strong>{money((Number(form.guests) || 0) * event.price_per_person)}</strong>
                </div>

                <button className="btn">Request event</button>
            </form>
        </section>
    );
};

export default Events;
