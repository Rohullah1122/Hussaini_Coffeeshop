import {Link} from "react-router-dom";
import FoodIcon from "../components/FoodIcon.jsx";
import "../styles/mainpage.css";


const ALvalues = [
    ["Roasted fresh","Our beans are roasted in small batches every week and ground for each cup.",1],
    ["Baked every morning","Croissants, muffins and banana bread come out of our oven before we open.",4],
    ["Made for everyone","Oat milk for any drink, plus vegan, vegetarian and gluten-free choices.",2]
];


const About = () => {

    return (
        <>

        {/* our story section about coffeeshop */}
            <section className="container section narrow">
                <span className="eyebrow">Our story</span>
                <h1>A small coffee shop with a big welcome</h1>
                <p className="lead">
                    Hussaini's started with a simple idea: a place in Airdrie where the coffee is made slowly, the pastries are
                    warm, and everyone who walks in feels like a regular.
                </p>
                <p className="muted">
                    We serve espresso drinks, cold brew and teas, light bites for the morning, hearty sandwiches and bowls for lunch,
                    and something sweet for the afternoon. Order ahead for pickup or delivery, book a table, or bring your friends and
                    team for a private event in our back room.
                </p>
            </section>


{/* drink cards coffee baked every morning */}
            <section className="container section">
                <div className="categorygrid">
                    {ALvalues.map(([title,text,icon]) =>
                        <div key={title} className="categorycard static">
                            <FoodIcon categoryid={icon} size={64} />
                            <h3>{title}</h3>
                            <p className="muted">{text}</p>
                        </div>
                    )}
                </div>
            </section>

{/* order pick up in ten minutes or book a table */}
            <section className="container section split">
                <div className="splitcard dark">
                    <span className="eyebrow">Come say hi</span>
                    <h2>Your table is waiting</h2>
                    <p>Book ahead on busy weekend mornings, or just walk in.</p>
                    <Link to="/reservation" className="btn light">Book a table</Link>
                </div>
                <div className="splitcard">
                    <span className="eyebrow">Hungry already?</span>
                    <h2>Order for pickup in 10 minutes</h2>
                    <p className="muted">Skip the line: order online and we'll have it ready.</p>
                    <Link to="/menu" className="btn">See the menu</Link>
                </div>
            </section>
        </>
    );
};

export default About;
