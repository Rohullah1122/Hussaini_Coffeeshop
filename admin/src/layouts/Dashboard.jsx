import {Link} from "react-router-dom";
import StatCard from "../components/StatCard.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import {sentiment} from "../js/sentiment.js";
import {adddays,dateonly,money,prettydate,prettydatetime,prettytime,today} from "../js/helpers.js";
import "../styles/dashboard.css";


const Dashboard = ({ALorders,ALreservations,ALmenu,ALreviews}) => {
    const ALvalid = ALorders.filter((o) => o.status !== "cancelled");
    const daykey = (o) => dateonly(new Date(o.created_at));


    // orders and sales for each of the last 7 days
    const ALweek = [...Array(7)].map((_,i) => {
        const day = adddays(today(),i - 6);
        const ALday = ALvalid.filter((o) => daykey(o) === day);
        return {day,orders: ALday.length,sales: ALday.reduce((sum,o) => sum + o.total,0)};
    });
    const most = Math.max(1,...ALweek.map((d) => d.orders));

    const ALtoday = ALvalid.filter((o) => daykey(o) === today());
    const weeksales = ALweek.reduce((sum,d) => sum + d.sales,0);
    const open = ALorders.filter((o) => ["pending","preparing","ready"].includes(o.status)).length;


    // most ordered items
    const counts = {};
    ALvalid.forEach((o) => o.items.forEach((i) => { counts[i.item_name] = (counts[i.item_name] || 0) + i.quantity; }));
    const ALpopular = Object.entries(counts).sort((a,b) => b[1] - a[1]).slice(0,5);
    const topcount = ALpopular.length ? ALpopular[0][1] : 1;


    const ALupcoming = ALreservations
        .filter((r) => r.reservation_date >= today() && r.status !== "cancelled")
        .sort((a,b) => (a.reservation_date + a.reservation_time).localeCompare(b.reservation_date + b.reservation_time))
        .slice(0,5);

    const average = ALreviews.length ? ALreviews.reduce((sum,r) => sum + r.rating,0) / ALreviews.length : 0;
    const feelings = {positive: 0,mixed: 0,negative: 0};
    ALreviews.forEach((r) => { feelings[sentiment(r)] += 1; });

    const ALlatest = [...ALorders].sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice(0,6);
    const soldout = ALmenu.filter((m) => !m.is_available).length;


    return (
        <div className="pagewrap">
            <div className="pagetitle">
                <div>
                    <h1>Dashboard</h1>
                    <p className="muted">{new Date().toLocaleDateString("en-CA",{weekday: "long",month: "long",day: "numeric"})}</p>
                </div>
            </div>

            <div className="stats">
                <StatCard label="Orders today" value={ALtoday.length} note={money(ALtoday.reduce((s,o) => s + o.total,0)) + " in sales"} tone="latte" />
                <StatCard label="Sales this week" value={money(weeksales)} note={ALweek.reduce((s,d) => s + d.orders,0) + " orders"} tone="sage" />
                <StatCard label="Open orders" value={open} note="pending, preparing or ready" tone="caramel" />
                <StatCard label="Average rating" value={average.toFixed(1) + " ★"} note={ALreviews.length + " reviews"} tone="rose" />
            </div>

            <div className="dashgrid">
                <section className="panel">
                    <h2>Orders per day</h2>
                    <div className="barchart" role="img" aria-label="Orders per day for the last 7 days">
                        {ALweek.map((d) =>
                            <div key={d.day} className="barcol">
                                <span className="barvalue">{d.orders}</span>
                                <div className="bar" style={{height: (d.orders / most) * 100 + "%"}} title={money(d.sales)} />
                                <span className="barlabel">{d.day === today() ? "Today" : new Date(d.day + "T12:00:00").toLocaleDateString("en-CA",{weekday: "short"})}</span>
                            </div>
                        )}
                    </div>
                </section>

                <section className="panel">
                    <h2>Most popular items</h2>
                    <ul className="popular">
                        {ALpopular.map(([name,count]) =>
                            <li key={name}>
                                <div className="popularrow"><span>{name}</span><strong>{count}</strong></div>
                                <div className="track"><div style={{width: (count / topcount) * 100 + "%"}} /></div>
                            </li>
                        )}
                    </ul>
                    {soldout > 0 && <p className="warn">{soldout} menu {soldout === 1 ? "item is" : "items are"} sold out. <Link to="/menu">Manage menu</Link></p>}
                </section>

                <section className="panel wide">
                    <div className="panelhead"><h2>Latest orders</h2><Link to="/orders">All orders →</Link></div>
                    <div className="tablewrap">
                        <table>
                            <thead><tr><th>#</th><th>Customer</th><th>Type</th><th>Time</th><th>Total</th><th>Status</th></tr></thead>
                            <tbody>
                                {ALlatest.map((o) =>
                                    <tr key={o.id}>
                                        <td>{o.id}</td>
                                        <td>{o.customer_name}</td>
                                        <td className="cap">{o.order_type}</td>
                                        <td>{prettydatetime(o.created_at)}</td>
                                        <td>{money(o.total)}</td>
                                        <td><StatusBadge status={o.status} /></td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="panel">
                    <div className="panelhead"><h2>Upcoming bookings</h2><Link to="/reservations">All →</Link></div>
                    {ALupcoming.length === 0 && <p className="muted">No upcoming bookings.</p>}
                    <ul className="upcoming">
                        {ALupcoming.map((r) =>
                            <li key={r.id}>
                                <div>
                                    <strong>{r.booking_type === "event" ? r.event_type : "Table for " + r.guests}</strong>
                                    <span className="muted">{r.full_name} · {prettydate(r.reservation_date)} {prettytime(r.reservation_time)}</span>
                                </div>
                                <StatusBadge status={r.status} />
                            </li>
                        )}
                    </ul>
                </section>

                <section className="panel">
                    <div className="panelhead"><h2>Customer feedback</h2><Link to="/reviews">Read →</Link></div>
                    <div className="feelings">
                        <div className="feeling positive"><strong>{feelings.positive}</strong><span>Positive</span></div>
                        <div className="feeling mixed"><strong>{feelings.mixed}</strong><span>Mixed</span></div>
                        <div className="feeling negative"><strong>{feelings.negative}</strong><span>Negative</span></div>
                    </div>
                    <p className="muted small">Sentiment is worked out from the words in each review and its stars.</p>
                </section>
            </div>
        </div>
    );
};

export default Dashboard;
