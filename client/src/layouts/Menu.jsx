import {useState} from "react";
import {useSearchParams} from "react-router-dom";
import ALcategories from "../data/categories.json";
import MenuCard from "../components/MenuCard.jsx";
import Filters from "../components/Filters.jsx";
import "../styles/menu.css";


const Menu = ({ALmenu,addtocart,ALcart}) => {
    const [params] = useSearchParams();
    const maxprice = Math.max(...ALmenu.map((m) => m.price));

    const [filters,setfilters] = useState({
        search: "",
        category: Number(params.get("category")) || 0,
        diets: [],
        maxprice: Math.ceil(maxprice),
        sort: "popular"
    });


    const words = filters.search.trim().toLowerCase();

    const ALshown = ALmenu
        .filter((m) => filters.category === 0 || m.category_id === filters.category)
        .filter((m) => filters.diets.every((d) => m[d]))
        .filter((m) => m.price <= filters.maxprice)
        .filter((m) => !words || (m.name + " " + m.description + " " + m.ingredients.join(" ")).toLowerCase().includes(words))
        .sort((a,b) => {
            if (filters.sort === "low") return a.price - b.price;
            if (filters.sort === "high") return b.price - a.price;
            if (filters.sort === "name") return a.name.localeCompare(b.name);
            return b.popularity - a.popularity;
        });

    const incartof = (id) => ALcart.find((c) => c.id === id)?.quantity || 0;

    const reset = () => setfilters({search: "",category: 0,diets: [],maxprice: Math.ceil(maxprice),sort: "popular"});


    return (
        <section className="container section">
            <div className="pagehead">
                <span className="eyebrow">Order for pickup or delivery</span>
                <h1>Our menu</h1>
            </div>

            <Filters filters={filters} setfilters={setfilters} maxprice={maxprice} />

            <p className="muted resultcount">{ALshown.length} {ALshown.length === 1 ? "item" : "items"}</p>

            {ALshown.length === 0 ?
                <div className="empty">
                    <h2>Nothing matches</h2>
                    <p className="muted">Try another search or fewer filters.</p>
                    <button className="btn" onClick={reset}>Clear filters</button>
                </div>
                :
                ALcategories
                    .filter((c) => ALshown.some((m) => m.category_id === c.id))
                    .map((c) =>
                        <div key={c.id} className="menusection">
                            <h2>{c.name}</h2>
                            <div className="menugrid">
                                {ALshown.filter((m) => m.category_id === c.id).map((item) =>
                                    <MenuCard key={item.id} item={item} addtocart={addtocart} incart={incartof(item.id)} />
                                )}
                            </div>
                        </div>
                    )
            }
        </section>
    );
};

export default Menu;
