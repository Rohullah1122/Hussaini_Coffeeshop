import {useState} from "react";
import {Link,useNavigate} from "react-router-dom";
import CartItem from "../components/CartItem.jsx";
import cafe from "../data/cafe.json";
import {money} from "../js/helpers.js";
import "../styles/cart.css";


const Cart = ({ALcart,user,changeqty,removefromcart,placeorder}) => {
    const navigate = useNavigate();

    const [form,setform] = useState({
        customer_name: user ? user.full_name : "",
        phone: user ? user.phone || "" : "",
        order_type: "pickup",
        address: "",
        payment: "Pay at pickup",
        notes: ""
    });
    const [errors,seterrors] = useState({});


    const subtotal = ALcart.reduce((sum,c) => sum + c.price * c.quantity,0);
    const tax = subtotal * cafe.tax_rate;
    const delivery = form.order_type === "delivery" ? cafe.delivery_fee : 0;
    const total = subtotal + tax + delivery;


    const set = (key) => (e) => setform({...form,[key]: e.target.value});


    const checkout = (e) => {
        e.preventDefault();

        const ALerrors = {};
        if (form.customer_name.trim().length < 2) ALerrors.customer_name = "Please enter your name.";
        if (!/^[0-9()+\-\s]{10,}$/.test(form.phone.trim())) ALerrors.phone = "Please enter a valid phone number.";
        if (form.order_type === "delivery" && form.address.trim().length < 6) ALerrors.address = "Please enter your delivery address.";

        seterrors(ALerrors);
        if (Object.keys(ALerrors).length) return;

        const id = placeorder({
            customer_name: form.customer_name.trim(),
            phone: form.phone.trim(),
            order_type: form.order_type,
            address: form.order_type === "delivery" ? form.address.trim() : null,
            payment: form.payment,
            notes: form.notes.trim()
        });
        navigate("/order/" + id);
    };


    if (!ALcart.length) {
        return (
            <section className="container section empty">
                <h1>Your cart is empty</h1>
                <p className="muted">Pick a coffee and something sweet to go with it.</p>
                <Link to="/menu" className="btn">Browse the menu</Link>
            </section>
        );
    }


    return (
        <section className="container section">
            <div className="pagehead">
                <span className="eyebrow">Checkout</span>
                <h1>Your cart</h1>
            </div>

            <div className="cartgrid">
                <div className="card">
                    {ALcart.map((item) =>
                        <CartItem key={item.id} item={item} changeqty={changeqty} removefromcart={removefromcart} />
                    )}
                    <Link to="/menu" className="linkbtn">+ Add more items</Link>
                </div>

                <form className="card checkout" onSubmit={checkout} noValidate>
                    <h2>Pickup or delivery?</h2>
                    <div className="toggle">
                        {["pickup","delivery"].map((t) =>
                            <label key={t} className={form.order_type === t ? "active" : ""}>
                                <input type="radio" name="order_type" value={t} checked={form.order_type === t}
                                    onChange={(e) => setform({...form,order_type: e.target.value,payment: e.target.value === "pickup" ? "Pay at pickup" : "Pay online (simulated)"})} />
                                {t === "pickup" ? "Pickup · 10–15 min" : "Delivery · 30–40 min"}
                            </label>
                        )}
                    </div>

                    <label className="field">Name
                        <input value={form.customer_name} onChange={set("customer_name")} autoComplete="name" />
                        {errors.customer_name && <span className="error">{errors.customer_name}</span>}
                    </label>

                    <label className="field">Phone
                        <input value={form.phone} onChange={set("phone")} autoComplete="tel" placeholder="403-555-0100" />
                        {errors.phone && <span className="error">{errors.phone}</span>}
                    </label>

                    {form.order_type === "delivery" &&
                        <label className="field">Delivery address
                            <input value={form.address} onChange={set("address")} autoComplete="street-address" />
                            {errors.address && <span className="error">{errors.address}</span>}
                        </label>
                    }

                    <label className="field">Payment
                        <select value={form.payment} onChange={set("payment")}>
                            {form.order_type === "pickup" && <option>Pay at pickup</option>}
                            <option>Pay online (simulated)</option>
                        </select>
                    </label>

                    <label className="field">Notes (optional)
                        <textarea rows="2" value={form.notes} onChange={set("notes")} placeholder="Extra hot, no sugar..." />
                    </label>

                    <div className="totals">
                        <p><span>Subtotal</span><span>{money(subtotal)}</span></p>
                        <p><span>GST (5%)</span><span>{money(tax)}</span></p>
                        {form.order_type === "delivery" && <p><span>Delivery</span><span>{money(delivery)}</span></p>}
                        <p className="grand"><span>Total</span><span>{money(total)}</span></p>
                    </div>

                    <button className="btn full">Place order · {money(total)}</button>
                    {!user && <p className="muted small">Ordering as a guest. <Link to="/login">Log in</Link> to see it in your account later.</p>}
                </form>
            </div>
        </section>
    );
};

export default Cart;
