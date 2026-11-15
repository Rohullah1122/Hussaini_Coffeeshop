import {useState} from "react";
import {NavLink} from "react-router-dom";
import "../styles/sidebar.css";


const ALlinks = [
    ["/","Dashboard","M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z"],
    ["/menu","Menu","M4 6h16M4 12h16M4 18h10"],
    ["/orders","Orders","M6 6h15l-1.5 9h-12zM6 6 5 3H2"],
    ["/reservations","Reservations","M4 5h16v16H4zM4 9h16M9 3v4M15 3v4"],
    ["/customers","Customers","M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0"],
    ["/reviews","Reviews","m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"]
];


const Sidebar = ({admin,logout,resetdemo,pendingorders,pendingbookings}) => {
    const [open,setopen] = useState(false);
    const [sure,setsure] = useState(false);

    const badges = {"/orders": pendingorders,"/reservations": pendingbookings};


    return (
        <aside className="sidebar">
            <div className="sidebartop">
                <div className="brand">
                    <span className="brandmark">H</span>
                    <div>
                        <strong>Hussaini's</strong>
                        <span>Admin panel</span>
                    </div>
                </div>
                <button className="menubtn" onClick={() => setopen(!open)} aria-expanded={open}>Menu</button>
            </div>

            <nav className={open ? "sidenav open" : "sidenav"}>
                {ALlinks.map(([to,label,icon]) =>
                    <NavLink key={to} to={to} end={to === "/"} onClick={() => setopen(false)}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={icon} /></svg>
                        <span>{label}</span>
                        {badges[to] > 0 && <em className="badge">{badges[to]}</em>}
                    </NavLink>
                )}
            </nav>

            <div className={open ? "sidebottom open" : "sidebottom"}>
                <p className="who">{admin.full_name}<span>{admin.email}</span></p>
                {sure ?
                    <div className="sure">
                        <button className="btn small danger" onClick={() => { resetdemo(); setsure(false); }}>Yes, reset</button>
                        <button className="btn small ghost" onClick={() => setsure(false)}>Cancel</button>
                    </div>
                    :
                    <button className="btn small ghost" onClick={() => setsure(true)}>Reset demo data</button>
                }
                <button className="btn small ghost" onClick={logout}>Log out</button>
            </div>
        </aside>
    );
};

export default Sidebar;
