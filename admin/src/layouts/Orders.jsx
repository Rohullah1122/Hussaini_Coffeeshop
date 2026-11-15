import {Fragment,useState} from "react";
import StatusBadge from "../components/StatusBadge.jsx";
import {ORDERSTATUS,money,prettydatetime} from "../js/helpers.js";
import "../styles/tables.css";


// the next step for each status, for the quick button
const NEXT = {pending: "preparing",preparing: "ready",ready: "delivered"};


const Orders = ({ALorders,setorderstatus}) => {
    const [filter,setfilter] = useState("open");
    const [search,setsearch] = useState("");
    const [openid,setopenid] = useState(null);


    const words = search.trim().toLowerCase();
    const ALshown = [...ALorders]
        .filter((o) => filter === "all" || (filter === "open" ? ["pending","preparing","ready"].includes(o.status) : o.status === filter))
        .filter((o) => !words || String(o.id).includes(words) || o.customer_name.toLowerCase().includes(words))
        .sort((a,b) => new Date(b.created_at) - new Date(a.created_at));

    const count = (s) => ALorders.filter((o) => (s === "open" ? ["pending","preparing","ready"].includes(o.status) : o.status === s)).length;


    return (
        <div className="pagewrap">
            <div className="pagetitle">
                <div>
                    <h1>Orders</h1>
                    <p className="muted">Move each order along: pending → preparing → ready → delivered.</p>
                </div>
            </div>

            <div className="toolbar">
                <input type="search" placeholder="Search by # or customer..." value={search} onChange={(e) => setsearch(e.target.value)} aria-label="Search orders" />
                <div className="pills">
                    {["open","all",...ORDERSTATUS].map((s) =>
                        <button key={s} className={filter === s ? "pill active" : "pill"} onClick={() => setfilter(s)}>
                            {s}{s !== "all" && " (" + count(s) + ")"}
                        </button>
                    )}
                </div>
            </div>

            <div className="panel tablewrap">
                <table>
                    <thead>
                        <tr><th>#</th><th>Customer</th><th>Items</th><th>Type</th><th>Placed</th><th>Total</th><th>Status</th><th></th></tr>
                    </thead>
                    <tbody>
                        {ALshown.map((o) =>
                            <Fragment key={o.id}>
                                <tr>
                                    <td>
                                        <button className="linkbtn" onClick={() => setopenid(openid === o.id ? null : o.id)} aria-expanded={openid === o.id}>#{o.id}</button>
                                    </td>
                                    <td>{o.customer_name}<span className="sub">{o.phone}</span></td>
                                    <td>{o.items.reduce((s,i) => s + i.quantity,0)} items</td>
                                    <td className="cap">{o.order_type}</td>
                                    <td>{prettydatetime(o.created_at)}</td>
                                    <td>{money(o.total)}</td>
                                    <td>
                                        <select className={"statusselect " + o.status} value={o.status} onChange={(e) => setorderstatus(o.id,e.target.value)} aria-label={"Status of order " + o.id}>
                                            {ORDERSTATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </td>
                                    <td className="actions">
                                        {NEXT[o.status] && <button className="btn small" onClick={() => setorderstatus(o.id,NEXT[o.status])}>Mark {NEXT[o.status]}</button>}
                                    </td>
                                </tr>
                                {openid === o.id &&
                                    <tr className="details">
                                        <td colSpan="8">
                                            <div className="detailbox">
                                                <ul>
                                                    {o.items.map((i) => <li key={i.menu_item_id}>{i.quantity} × {i.item_name} <span>{money(i.unit_price * i.quantity)}</span></li>)}
                                                </ul>
                                                <div>
                                                    {o.address && <p><strong>Deliver to:</strong> {o.address}</p>}
                                                    <p><strong>Payment:</strong> {o.payment}</p>
                                                    {o.notes && <p><strong>Notes:</strong> {o.notes}</p>}
                                                    <p><strong>Subtotal</strong> {money(o.subtotal)} · <strong>GST</strong> {money(o.tax)}{o.delivery_fee > 0 && <> · <strong>Delivery</strong> {money(o.delivery_fee)}</>}</p>
                                                    <p>Status: <StatusBadge status={o.status} /></p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                }
                            </Fragment>
                        )}
                    </tbody>
                </table>
                {ALshown.length === 0 && <p className="muted emptyrow">No orders here.</p>}
            </div>
        </div>
    );
};

export default Orders;
