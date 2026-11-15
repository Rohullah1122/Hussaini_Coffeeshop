import {useState} from "react";
import FoodIcon from "./FoodIcon.jsx";
import {money} from "../js/helpers.js";
import "../styles/menu.css";


const MenuCard = ({item,addtocart,incart = 0}) => {
    const [added,setadded] = useState(false);
    const [showing,setshowing] = useState(false);


    const add = () => {
        addtocart(item);
        setadded(true);
        setTimeout(() => setadded(false),1200);
    };


    const ALtags = [
        item.is_vegan && "Vegan",
        item.is_vegetarian && !item.is_vegan && "Vegetarian",
        item.is_gluten_free && "Gluten-free",
        item.is_dairy_free && "Dairy-free"
    ].filter(Boolean);


    return (
        <article className={item.is_available ? "menucard" : "menucard soldout"}>
            <div className="menucardtop">
                <FoodIcon categoryid={item.category_id} />
                {item.is_special && <span className="ribbon">Today's special</span>}
                {!item.is_available && <span className="ribbon grey">Sold out</span>}
            </div>

            <div className="menucardbody">
                <div className="menucardtitle">
                    <h3>{item.name}</h3>
                    <span className="price">{money(item.price)}</span>
                </div>
                <p className="muted">{item.description}</p>

                {ALtags.length > 0 &&
                    <div className="tags">
                        {ALtags.map((t) => <span key={t} className="tag">{t}</span>)}
                    </div>
                }

                <button className="linkbtn" onClick={() => setshowing(!showing)} aria-expanded={showing}>
                    {showing ? "Hide ingredients" : "Ingredients"}
                </button>
                {showing && <p className="ingredients">{item.ingredients.join(", ")}</p>}

                <button className={added ? "btn full added" : "btn full"} onClick={add} disabled={!item.is_available}>
                    {!item.is_available ? "Sold out" : added ? "Added ✓" : incart > 0 ? "Add another (" + incart + " in cart)" : "Add to cart"}
                </button>
            </div>
        </article>
    );
};

export default MenuCard;
