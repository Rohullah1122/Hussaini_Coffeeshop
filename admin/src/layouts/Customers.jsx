import {useState} from "react";
import {money} from "../js/helpers.js";
import "../styles/tables.css";


const Customers = ({ALusers,ALorders,setuserrole,deleteuser}) => {
    const [search,setsearch] = useState("");
    const [deleting,setdeleting] = useState(null);


    const words = search.trim().toLowerCase();
    const ALshown = ALusers.filter((u) => !words || (u.full_name + " " + u.email).toLowerCase().includes(words));

    const statsfor = (id) => {
        const ALmine = ALorders.filter((o) => o.user_id === id && o.status !== "cancelled");
        return {orders: ALmine.length,spent: ALmine.reduce((s,o) => s + o.total,0)};
    };


    return (
        <div className="pagewrap">
            <div className="pagetitle">
                <div>
                    <h1>Customers</h1>
                    <p className="muted">{ALusers.length} accounts</p>
                </div>
            </div>

            <div className="toolbar">
                <input type="search" placeholder="Search by name or email..." value={search} onChange={(e) => setsearch(e.target.value)} aria-label="Search customers" />
            </div>

            <div className="panel tablewrap">
                <table>
                    <thead>
                        <tr><th>Name</th><th>Phone</th><th>Joined</th><th>Orders</th><th>Spent</th><th>Role</th><th></th></tr>
                    </thead>
                    <tbody>
                        {ALshown.map((u) => {
                            const s = statsfor(u.id);
                            return (
                                <tr key={u.id}>
                                    <td><strong>{u.full_name}</strong><span className="sub">{u.email}</span></td>
                                    <td>{u.phone || "—"}</td>
                                    <td>{u.joined}</td>
                                    <td>{s.orders}</td>
                                    <td>{money(s.spent)}</td>
                                    <td>
                                        <select value={u.role} onChange={(e) => setuserrole(u.id,e.target.value)} aria-label={"Role of " + u.full_name}>
                                            <option value="customer">Customer</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </td>
                                    <td className="actions">
                                        {deleting === u.id ?
                                            <>
                                                <button className="btn small danger" onClick={() => { deleteuser(u.id); setdeleting(null); }}>Delete</button>
                                                <button className="btn small ghost" onClick={() => setdeleting(null)}>Keep</button>
                                            </>
                                            :
                                            <button className="btn small ghost dangertext" onClick={() => setdeleting(u.id)}>Delete</button>
                                        }
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {ALshown.length === 0 && <p className="muted emptyrow">No customers match.</p>}
            </div>
        </div>
    );
};

export default Customers;
