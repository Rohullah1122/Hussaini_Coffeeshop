import {Link,useParams} from "react-router-dom";
import {money,STEPS,steplabel} from "../js/helpers.js";
import "../styles/cart.css";


const OrderConfirm = ({ALorders}) => {
    const {id} = useParams();
    const order = ALorders.find((o) => o.id === Number(id));


    if (!order) {
        return (
            <section className="container section empty">
                <h1>Order not found</h1>
                <Link to="/menu" className="btn">Back to menu</Link>
            </section>
        );
    }

    // the admin changes the status, and it shows up here right away
    const status = order.status;
    const current = STEPS.indexOf(status);


    return (
        <section className="container section narrow">
            <div className="card confirm">
                <div className="checkmark" aria-hidden="true">✓</div>
                <span className="eyebrow">Order #{order.id}</span>
                <h1>Thanks, {order.customer_name.split(" ")[0]}! Your order is in.</h1>
                <p className="muted">
                    {order.order_type === "pickup" ? "Pick it up at the counter in about 10–15 minutes." : "It will be at " + order.address + " in about 30–40 minutes."}
                </p>

                {status === "cancelled" ?
                    <p className="statusline cancelled">This order was cancelled.</p>
                    :
                    <ol className="tracker">
                        {STEPS.map((s,i) =>
                            <li key={s} className={i <= current ? "done" : ""}>
                                <span className="dot" />
                                {steplabel(s,order.order_type)}
                            </li>
                        )}
                    </ol>
                }

                <div className="receipt">
                    {order.items.map((i) =>
                        <p key={i.menu_item_id}><span>{i.quantity} × {i.item_name}</span><span>{money(i.unit_price * i.quantity)}</span></p>
                    )}
                    <p><span>GST</span><span>{money(order.tax)}</span></p>
                    {order.delivery_fee > 0 && <p><span>Delivery</span><span>{money(order.delivery_fee)}</span></p>}
                    <p className="grand"><span>Total · {order.payment}</span><span>{money(order.total)}</span></p>
                </div>

                <div className="buttons center">
                    <Link to="/menu" className="btn outline">Order more</Link>
                    <Link to="/account" className="btn">Track in my account</Link>
                </div>
            </div>
        </section>
    );
};

export default OrderConfirm;
