import FoodIcon from "./FoodIcon.jsx";
import {money} from "../js/helpers.js";


const CartItem = ({item,changeqty,removefromcart}) => {

    return (
        <div className="cartitem">
            <FoodIcon categoryid={item.category_id} size={44} />

            <div className="cartiteminfo">
                <h3>{item.name}</h3>
                <span className="muted">{money(item.price)} each</span>
            </div>

            <div className="qty">
                <button onClick={() => changeqty(item.id,item.quantity - 1)} aria-label={"One less " + item.name}>−</button>
                <span aria-live="polite">{item.quantity}</span>
                <button onClick={() => changeqty(item.id,item.quantity + 1)} aria-label={"One more " + item.name}>+</button>
            </div>

            <strong className="linetotal">{money(item.price * item.quantity)}</strong>

            <button className="linkbtn danger" onClick={() => removefromcart(item.id)}>Remove</button>
        </div>
    );
};

export default CartItem;
