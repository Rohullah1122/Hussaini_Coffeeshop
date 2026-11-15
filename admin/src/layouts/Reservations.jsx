import {useState} from "react";
import StatusBadge from "../components/StatusBadge.jsx";
import {BOOKINGSTATUS,money,prettydate,prettytime,today} from "../js/helpers.js";
import "../styles/tables.css";


const Reservations = ({ALreservations,setbookingstatus}) => {
    const [type,settype] = useState("all");
    const [when,setwhen] = useState("upcoming");


    const ALshown = ALreservations
        .filter((r) => type === "all" || r.booking_type === type)
        .filter((r) => when === "all" || (when === "upcoming" ? r.reservation_date >= today() : r.reservation_date < today()))
        .sort((a,b) => (a.reservation_date + a.reservation_time).localeCompare(b.reservation_date + b.reservation_time));

    const pending = ALreservations.filter((r) => r.status === "pending").length;


    return (
        <div className="pagewrap">
            <div className="pagetitle">
                <div>
                    <h1>Reservations & events</h1>
                    <p className="muted">{pending} waiting for approval</p>
                </div>
            </div>

            <div className="toolbar">
                <div className="pills">
                    {[["all","All"],["table","Tables"],["event","Events"]].map(([key,label]) =>
                        <button key={key} className={type === key ? "pill active" : "pill"} onClick={() => settype(key)}>{label}</button>
                    )}
                </div>
                <div className="pills">
                    {[["upcoming","Upcoming"],["past","Past"],["all","All dates"]].map(([key,label]) =>
                        <button key={key} className={when === key ? "pill active" : "pill"} onClick={() => setwhen(key)}>{label}</button>
                    )}
                </div>
            </div>

            <div className="panel tablewrap">
                <table>
                    <thead>
                        <tr><th>When</th><th>Booking</th><th>Guest</th><th>Guests</th><th>Notes</th><th>Status</th><th></th></tr>
                    </thead>
                    <tbody>
                        {ALshown.map((r) =>
                            <tr key={r.id}>
                                <td><strong>{prettydate(r.reservation_date)}</strong><span className="sub">{prettytime(r.reservation_time)}</span></td>
                                <td>
                                    {r.booking_type === "event" ? r.event_type : "Table"}
                                    {r.menu && <span className="sub">{r.menu}{r.estimated_total ? " · " + money(r.estimated_total) : ""}</span>}
                                </td>
                                <td>{r.full_name}<span className="sub">{r.phone}</span></td>
                                <td>{r.guests}</td>
                                <td className="notes">{r.notes || "—"}</td>
                                <td><StatusBadge status={r.status} /></td>
                                <td className="actions">
                                    {r.status === "pending" && <button className="btn small" onClick={() => setbookingstatus(r.id,"confirmed")}>Approve</button>}
                                    {r.status === "confirmed" && r.reservation_date <= today() && <button className="btn small" onClick={() => setbookingstatus(r.id,"completed")}>Completed</button>}
                                    {["pending","confirmed"].includes(r.status) && <button className="btn small ghost dangertext" onClick={() => setbookingstatus(r.id,"cancelled")}>Cancel</button>}
                                    {r.status === "cancelled" && <button className="btn small ghost" onClick={() => setbookingstatus(r.id,"pending")}>Restore</button>}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                {ALshown.length === 0 && <p className="muted emptyrow">No bookings here.</p>}
            </div>

            <p className="muted small">Statuses: {BOOKINGSTATUS.join(" · ")}</p>
        </div>
    );
};

export default Reservations;
