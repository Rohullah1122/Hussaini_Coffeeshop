import {Link} from "react-router-dom";
import cafe from "../data/cafe.json";
import {prettytime} from "../js/helpers.js";


const Footer = () => {
    const weekday = cafe.hours[0];
    const saturday = cafe.hours[5];
    const sunday = cafe.hours[6];


    return (
        <footer className="footer">
            <div className="container footergrid">
                <div>
                    <h3>Hussaini's Coffee Shop</h3>
                    <p>{cafe.tagline}</p>
                </div>

                <div>
                    <h4>Visit us</h4>
                    <p>{cafe.address}</p>
                    <p>{cafe.phone}</p>
                    <p>{cafe.email}</p>
                </div>

                <div>
                    <h4>Hours</h4>
                    <p>Mon–Fri {prettytime(weekday.open)} – {prettytime(weekday.close)}</p>
                    <p>Sat {prettytime(saturday.open)} – {prettytime(saturday.close)}</p>
                    <p>Sun {prettytime(sunday.open)} – {prettytime(sunday.close)}</p>
                </div>

                <div>
                    <h4>Explore</h4>
                    <Link to="/menu">Menu</Link>
                    <Link to="/reservation">Book a table</Link>
                    <Link to="/events">Events</Link>
                    <Link to="/account">My account</Link>
                </div>
            </div>
            <p className="copyright">© {new Date().getFullYear()} Hussaini's Coffee Shop · Smart Restaurant Management System</p>
        </footer>
    );
};

export default Footer;
