import {Link} from "react-router-dom";
import CoffeeCup from "../components/CoffeeCup.jsx";
import MenuCard from "../components/MenuCard.jsx";
import FoodIcon from "../components/FoodIcon.jsx";
import ALcategories from "../data/categories.json";
import cafe from "../data/cafe.json";
import {money,prettytime} from "../js/helpers.js";
import "../styles/mainpage.css";


const MainPage = ({ALmenu,addtocart}) => {
    const special = ALmenu.find((m) => m.is_special);
    const ALpopular = [...ALmenu].filter((m) => !m.is_special).sort((a,b) => b.popularity - a.popularity).slice(0,4);

    const day = new Date().toLocaleDateString("en-US",{weekday: "long"});
    const todayhours = cafe.hours.find((h) => h.day === day);


    return (
        <>
            <section className="hero">
                <div className="container herogrid">
                    <div className="herotext">
                        <span className="eyebrow">Open today · {prettytime(todayhours.open)} – {prettytime(todayhours.close)}</span>
                        <h1>Good coffee,<br />made <em>slowly</em>.</h1>
                        <p>{cafe.tagline} Order ahead for pickup or delivery, book a table, or host your next event with us.</p>
                        <div className="buttons">
                            <Link to="/menu" className="btn">Order now</Link>
                            <Link to="/reservation" className="btn outline">Book a table</Link>
                        </div>
                    </div>

                    <div className="heroanim">
                        <CoffeeCup />
                    </div>
                </div>
            </section>

            {special &&
                <section className="container special">
                    <FoodIcon categoryid={special.category_id} size={96} />
                    <div className="specialtext">
                        <span className="eyebrow">Today's special</span>
                        <h2>{special.name}</h2>
                        <p className="muted">{special.description}</p>
                    </div>
                    <div className="specialbuy">
                        <span className="bigprice">{money(special.price)}</span>
                        <button className="btn" onClick={() => addtocart(special)}>Add to cart</button>
                    </div>
                </section>
            }

            <section className="container section">
                <div className="sectionhead">
                    <div>
                        <span className="eyebrow">Customer favorites</span>
                        <h2>Most popular right now</h2>
                    </div>
                    <Link to="/menu" className="linkbtn">See full menu →</Link>
                </div>
                <div className="menugrid">
                    {ALpopular.map((item) => <MenuCard key={item.id} item={item} addtocart={addtocart} />)}
                </div>
            </section>

            <section className="container section">
                <div className="sectionhead">
                    <div>
                        <span className="eyebrow">Our menu</span>
                        <h2>Something for every hour</h2>
                    </div>
                </div>
                <div className="categorygrid">
                    {ALcategories.map((c) =>
                        <Link key={c.id} to={"/menu?category=" + c.id} className="categorycard">
                            <FoodIcon categoryid={c.id} size={64} />
                            <h3>{c.name}</h3>
                            <span className="muted">{ALmenu.filter((m) => m.category_id === c.id).length} items</span>
                        </Link>
                    )}
                </div>
            </section>

            <section className="container section split">
                <div className="splitcard dark">
                    <span className="eyebrow">Celebrate with us</span>
                    <h2>Birthdays, team meetings & latte art workshops</h2>
                    <p>Our back room fits up to 30 guests. We handle the coffee, food and setup.</p>
                    <Link to="/events" className="btn light">Plan an event</Link>
                </div>
                <div className="splitcard">
                    <span className="eyebrow">Visit us</span>
                    <h2>{cafe.address}</h2>
                    <ul className="hourslist">
                        {cafe.hours.map((h) =>
                            <li key={h.day} className={h.day === day ? "today" : ""}>
                                <span>{h.day}</span>
                                <span>{prettytime(h.open)} – {prettytime(h.close)}</span>
                            </li>
                        )}
                    </ul>
                </div>
            </section>
        </>
    );
};

export default MainPage;
