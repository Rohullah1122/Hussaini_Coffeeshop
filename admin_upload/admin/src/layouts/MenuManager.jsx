import {useState} from "react";
import MenuForm from "../components/MenuForm.jsx";
import {money} from "../js/helpers.js";
import "../styles/tables.css";


const ALcategories = {1: "Coffee & Drinks",2: "Light Bites",3: "Sandwiches & Bowls",4: "Pastries & Desserts"};


const MenuManager = ({ALmenu,savemenuitem,deletemenuitem,toggleavailable,setspecial}) => {
    const [search,setsearch] = useState("");
    const [category,setcategory] = useState(0);
    const [editing,setediting] = useState(null);
    const [adding,setadding] = useState(false);
    const [deleting,setdeleting] = useState(null);


    const words = search.trim().toLowerCase();
    const ALshown = ALmenu
        .filter((m) => category === 0 || m.category_id === category)
        .filter((m) => !words || m.name.toLowerCase().includes(words))
        .sort((a,b) => a.category_id - b.category_id || a.name.localeCompare(b.name));


    return (
        <div className="pagewrap">
            <div className="pagetitle">
                <div>
                    <h1>Menu</h1>
                    <p className="muted">{ALmenu.length} items · {ALmenu.filter((m) => !m.is_available).length} sold out</p>
                </div>
                <button className="btn" onClick={() => setadding(true)}>+ Add item</button>
            </div>

            <div className="toolbar">
                <input type="search" placeholder="Search items..." value={search} onChange={(e) => setsearch(e.target.value)} aria-label="Search menu items" />
                <div className="pills">
                    <button className={category === 0 ? "pill active" : "pill"} onClick={() => setcategory(0)}>All</button>
                    {Object.entries(ALcategories).map(([id,name]) =>
                        <button key={id} className={category === Number(id) ? "pill active" : "pill"} onClick={() => setcategory(Number(id))}>{name}</button>
                    )}
                </div>
            </div>

            <div className="panel tablewrap">
                <table>
                    <thead>
                        <tr><th>Item</th><th>Category</th><th>Price</th><th>Available</th><th>Special</th><th></th></tr>
                    </thead>
                    <tbody>
                        {ALshown.map((m) =>
                            <tr key={m.id} className={m.is_available ? "" : "dim"}>
                                <td>
                                    <strong>{m.name}</strong>
                                    <span className="sub">
                                        {[m.is_vegan && "Vegan",m.is_vegetarian && !m.is_vegan && "Vegetarian",m.is_gluten_free && "GF",m.is_dairy_free && "DF"].filter(Boolean).join(" · ")}
                                    </span>
                                </td>
                                <td>{ALcategories[m.category_id]}</td>
                                <td>{money(m.price)}</td>
                                <td>
                                    <label className="switch">
                                        <input type="checkbox" checked={m.is_available} onChange={() => toggleavailable(m.id)} aria-label={m.name + " available"} />
                                        <span />
                                    </label>
                                </td>
                                <td>
                                    <button className={m.is_special ? "star on" : "star"} onClick={() => setspecial(m.id)} aria-label={(m.is_special ? "Remove " : "Make ") + m.name + " today's special"}>★</button>
                                </td>
                                <td className="actions">
                                    {deleting === m.id ?
                                        <>
                                            <button className="btn small danger" onClick={() => { deletemenuitem(m.id); setdeleting(null); }}>Delete</button>
                                            <button className="btn small ghost" onClick={() => setdeleting(null)}>Keep</button>
                                        </>
                                        :
                                        <>
                                            <button className="btn small ghost" onClick={() => setediting(m)}>Edit</button>
                                            <button className="btn small ghost dangertext" onClick={() => setdeleting(m.id)}>Delete</button>
                                        </>
                                    }
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                {ALshown.length === 0 && <p className="muted emptyrow">No items match.</p>}
            </div>

            {(adding || editing) &&
                <MenuForm item={editing} save={savemenuitem} close={() => { setadding(false); setediting(null); }} />
            }
        </div>
    );
};

export default MenuManager;
