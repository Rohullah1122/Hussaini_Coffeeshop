import {useState} from "react";
import {Link,Navigate} from "react-router-dom";
import ALevents from "../data/events.json";
import cafe from "../data/cafe.json";
import {money,prettydate,prettytime,steplabel,timeslots,today} from "../js/helpers.js";
import "../styles/account.css";

// edit a booking form
const EditBooking = ({booking,ALreservations,updatereservation,close}) => {
    const [form,setform] = useState({
        reservation_date: booking.reservation_date,
        reservation_time: booking.reservation_time,
        guests: booking.guests
    });
    const [error,seterror] = useState("");

    const ALslots = timeslots(form.reservation_date);
    const event = ALevents.find((e) => e.name === booking.event_type);


    // save the changes to the booking, validating first
    const save = (e) => {
        e.preventDefault();
        const guests = Number(form.guests);
        const min = event ? event.min_guests : 1;
        const max = event ? event.max_guests : cafe.max_table_guests;

        if (form.reservation_date < today()) return seterror("Please pick today or a later date.");
        if (!ALslots.includes(form.reservation_time)) return seterror("Please pick a time when we're open.");
        if (guests < min || guests > max) return seterror("Guests must be between " + min + " and " + max + ".");

        const ALothers = ALreservations.filter((r) => r.id !== booking.id && r.status !== "cancelled" && r.booking_type === booking.booking_type);
        if (booking.booking_type === "table") {
            const taken = ALothers.filter((r) => r.reservation_date === form.reservation_date && r.reservation_time === form.reservation_time).length;
            if (taken >= cafe.tables) return seterror("Every table is booked at that time.");
        } else if (ALothers.some((r) => r.reservation_date === form.reservation_date)) {
            return seterror("The event room is already booked that day.");
        }
// save the changes to the booking
        updatereservation(booking.id,{
            ...form,
            guests,
            status: "pending",
            estimated_total: event ? guests * event.price_per_person : undefined
        });
        close();
    };

//returning booking form with date, time and guests fields, and save/cancel buttons
    return (
        <form className="editbooking" onSubmit={save} noValidate>
            <input type="date" min={today()} value={form.reservation_date} onChange={(e) => setform({...form,reservation_date: e.target.value})} aria-label="Date" />
            <select value={form.reservation_time} onChange={(e) => setform({...form,reservation_time: e.target.value})} aria-label="Time">
                <option value="">Time</option>
                {ALslots.map((t) => <option key={t} value={t}>{prettytime(t)}</option>)}
            </select>
            <input type="number" value={form.guests} onChange={(e) => setform({...form,guests: e.target.value})} aria-label="Guests" />
            <button className="btn small">Save</button>
            <button type="button" className="btn small outline" onClick={close}>Cancel</button>
            {error && <p className="error">{error}</p>}
        </form>
    );
};


// account page with tabs for orders, bookings and preferences
const Account = ({user,ALmenu,ALorders,ALreservations,cancelorder,updatereservation,updateuser,logout}) => {
    const [tab,settab] = useState("orders");
    const [editing,setediting] = useState(null);
    const [prefs,setprefs] = useState(user ? user.preferences || {favorite: "",milk: "Regular milk"} : {});
    const [saved,setsaved] = useState(false);


    if (!user) return <Navigate to="/login" replace />;


    const ALmyorders = ALorders.filter((o) => o.user_id === user.id).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    const ALmybookings = ALreservations.filter((r) => r.user_id === user.id || r.email === user.email)
        .sort((a,b) => (a.reservation_date + a.reservation_time).localeCompare(b.reservation_date + b.reservation_time));

    const savepreferences = (e) => {
        e.preventDefault();
        updateuser({preferences: prefs});
        setsaved(true);
        setTimeout(() => setsaved(false),2000);
    };


    return (
        <section className="container section">
            <div className="accounthead">
                <div>
                    <span className="eyebrow">My account</span>
                    <h1>Hi, {user.full_name.split(" ")[0]}!</h1>
                    <p className="muted">{user.email}</p>
                </div>
                <button className="btn outline" onClick={logout}>Log out</button>
            </div>

            <div className="tabs" role="tablist">
                {[["orders","My orders (" + ALmyorders.length + ")"],["bookings","My reservations (" + ALmybookings.length + ")"],["preferences","Preferences"]].map(([key,label]) =>
                    <button key={key} role="tab" aria-selected={tab === key} className={tab === key ? "tab active" : "tab"} onClick={() => settab(key)}>{label}</button>
                )}
            </div>

            {tab === "orders" &&
                <div className="list">
                    {ALmyorders.length === 0 && <div className="card empty"><p className="muted">No orders yet.</p><Link to="/menu" className="btn">Order now</Link></div>}
                    {ALmyorders.map((o) => {
                        const status = o.status;
                        return (
                            <article key={o.id} className="card row">
                                <div>
                                    <h3>Order #{o.id} <span className={"status " + status.replace(/ /g,"")}>{steplabel(status,o.order_type)}</span></h3>
                                    <p className="muted">{new Date(o.created_at).toLocaleString("en-CA",{dateStyle: "medium",timeStyle: "short"})} · {o.order_type}</p>
                                    <p>{o.items.map((i) => i.quantity + " × " + i.item_name).join(", ")}</p>
                                </div>
                                <div className="rowside">
                                    <strong>{money(o.total)}</strong>
                                    <Link to={"/order/" + o.id} className="linkbtn">Track</Link>
                                    {status === "pending" && <button className="linkbtn danger" onClick={() => cancelorder(o.id)}>Cancel</button>}
                                </div>
                            </article>
                        );
                    })}
                </div>
            }

            {tab === "bookings" &&
                <div className="list">
                    {ALmybookings.length === 0 &&
                        <div className="card empty">
                            <p className="muted">No reservations yet.</p>
                            <div className="buttons center"><Link to="/reservation" className="btn">Book a table</Link><Link to="/events" className="btn outline">Plan an event</Link></div>
                        </div>
                    }
                    {ALmybookings.map((r) => {
                        const past = r.reservation_date < today();
                        return (
                            <article key={r.id} className="card row">
                                <div>
                                    <h3>{r.booking_type === "event" ? r.event_type : "Table"} <span className={"status " + r.status}>{r.status}</span></h3>
                                    <p className="muted">{prettydate(r.reservation_date)} at {prettytime(r.reservation_time)} · {r.guests} guests{r.menu ? " · " + r.menu : ""}</p>
                                    {editing === r.id &&
                                        <EditBooking booking={r} ALreservations={ALreservations} updatereservation={updatereservation} close={() => setediting(null)} />
                                    }
                                </div>
                                {!past && r.status !== "cancelled" && editing !== r.id &&
                                    <div className="rowside">
                                        {r.estimated_total && <strong>{money(r.estimated_total)}</strong>}
                                        <button className="linkbtn" onClick={() => setediting(r.id)}>Change</button>
                                        <button className="linkbtn danger" onClick={() => updatereservation(r.id,{status: "cancelled"})}>Cancel</button>
                                    </div>
                                }
                            </article>
                        );
                    })}
                </div>
            }

            {tab === "preferences" &&
                <form className="card prefs" onSubmit={savepreferences}>
                    <label className="field">Favorite drink
                        <select value={prefs.favorite} onChange={(e) => setprefs({...prefs,favorite: e.target.value})}>
                            <option value="">No favorite yet</option>
                            {ALmenu.filter((m) => m.category_id === 1).map((m) => <option key={m.id}>{m.name}</option>)}
                        </select>
                    </label>
                    <label className="field">Milk
                        <select value={prefs.milk} onChange={(e) => setprefs({...prefs,milk: e.target.value})}>
                            {["Regular milk","Oat milk","Almond milk","Soy milk","No milk"].map((m) => <option key={m}>{m}</option>)}
                        </select>
                    </label>
                    {saved && <p className="success">Saved!</p>}
                    <button className="btn">Save preferences</button>
                </form>
            }
        </section>
    );
};

export default Account;
