import {useState} from "react";
import {Link,NavLink} from "react-router-dom";
import "../styles/navbar.css";


const ALlinks = [
    ["/","Home"],
    ["/menu","Menu"],
    ["/reservation","Reservations"],
    ["/events","Events"],
    ["/about","About"],
    ["/contact","Contact"]
];


const Navbar = ({cartcount,user}) => {
    const [open,setopen] = useState(false);


    return (
        <header className="navbar">
            <div className="navinner">
                <Link to="/" className="logo" onClick={() => setopen(false)}>
                    <span className="logomark">H</span>
                    <span>Hussaini's <em>Coffee</em></span>
                </Link>

                <nav className={open ? "navlinks open" : "navlinks"}>
                    {ALlinks.map(([to,label]) =>
                        <NavLink key={to} to={to} end={to === "/"} onClick={() => setopen(false)}>{label}</NavLink>
                    )}
                </nav>

                <div className="navright">
                    <Link to="/cart" className="carticon" aria-label={"Cart, " + cartcount + " items"} onClick={() => setopen(false)}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M6 6h15l-1.5 9h-12z" /><path d="M6 6 5 3H2" /><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" />
                        </svg>
                        {cartcount > 0 && <span key={cartcount} className="cartbadge">{cartcount}</span>}
                    </Link>

                    <Link to={user ? "/account" : "/login"} className="btn small" onClick={() => setopen(false)}>
                        {user ? user.full_name.split(" ")[0] : "Login"}
                    </Link>

                    <button className="menutoggle" onClick={() => setopen(!open)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open}>
                        <span /><span /><span />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
