import {useState} from "react";
import "../styles/forms.css";


const ALcategories = [[1,"Coffee & Drinks"],[2,"Light Bites"],[3,"Sandwiches & Bowls"],[4,"Pastries & Desserts"]];

const ALdiets = [["is_vegetarian","Vegetarian"],["is_vegan","Vegan"],["is_gluten_free","Gluten-free"],["is_dairy_free","Dairy-free"]];

const blank = {
    name: "",category_id: 1,description: "",ingredients: [],price: "",
    is_vegetarian: false,is_vegan: false,is_gluten_free: false,is_dairy_free: false,
    is_special: false,is_available: true
};


const MenuForm = ({item,save,close}) => {
    const [form,setform] = useState(item ? {...item,ingredients: item.ingredients.join(", ")} : {...blank,ingredients: ""});
    const [errors,seterrors] = useState({});


    const set = (key) => (e) => setform({...form,[key]: e.target.type === "checkbox" ? e.target.checked : e.target.value});


    const submit = (e) => {
        e.preventDefault();

        const ALerrors = {};
        const price = Number(form.price);
        if (form.name.trim().length < 2) ALerrors.name = "Name is required.";
        if (!form.price || isNaN(price) || price <= 0 || price > 200) ALerrors.price = "Enter a price between $0.01 and $200.";
        if (form.description.trim().length < 5) ALerrors.description = "Write a short description.";

        seterrors(ALerrors);
        if (Object.keys(ALerrors).length) return;

        save({
            ...form,
            name: form.name.trim(),
            category_id: Number(form.category_id),
            description: form.description.trim(),
            ingredients: form.ingredients.split(",").map((i) => i.trim()).filter(Boolean),
            price: +price.toFixed(2)
        });
        close();
    };


    return (
        <div className="overlay" onClick={close}>
            <form className="modal" onSubmit={submit} onClick={(e) => e.stopPropagation()} noValidate>
                <h2>{item ? "Edit " + item.name : "Add a menu item"}</h2>

                <div className="formgrid">
                    <label className="field">Name
                        <input value={form.name} onChange={set("name")} autoFocus />
                        {errors.name && <span className="error">{errors.name}</span>}
                    </label>
                    <label className="field">Category
                        <select value={form.category_id} onChange={set("category_id")}>
                            {ALcategories.map(([id,name]) => <option key={id} value={id}>{name}</option>)}
                        </select>
                    </label>
                    <label className="field">Price ($)
                        <input type="number" step="0.01" min="0" value={form.price} onChange={set("price")} />
                        {errors.price && <span className="error">{errors.price}</span>}
                    </label>
                </div>

                <label className="field">Description
                    <textarea rows="2" value={form.description} onChange={set("description")} />
                    {errors.description && <span className="error">{errors.description}</span>}
                </label>

                <label className="field">Ingredients (comma separated)
                    <input value={form.ingredients} onChange={set("ingredients")} placeholder="espresso, oat milk, caramel" />
                </label>

                <fieldset className="checks">
                    <legend>Dietary</legend>
                    {ALdiets.map(([key,label]) =>
                        <label key={key}><input type="checkbox" checked={form[key]} onChange={set(key)} />{label}</label>
                    )}
                </fieldset>

                <fieldset className="checks">
                    <legend>Status</legend>
                    <label><input type="checkbox" checked={form.is_available} onChange={set("is_available")} />Available</label>
                    <label><input type="checkbox" checked={form.is_special} onChange={set("is_special")} />Today's special</label>
                </fieldset>

                <div className="modalbuttons">
                    <button type="button" className="btn ghost" onClick={close}>Cancel</button>
                    <button className="btn">{item ? "Save changes" : "Add item"}</button>
                </div>
            </form>
        </div>
    );
};

export default MenuForm;
