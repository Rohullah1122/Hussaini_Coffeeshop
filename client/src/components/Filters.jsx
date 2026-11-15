import ALcategories from "../data/categories.json";


const ALdiets = [
    ["is_vegetarian","Vegetarian"],
    ["is_vegan","Vegan"],
    ["is_gluten_free","Gluten-free"],
    ["is_dairy_free","Dairy-free"]
];


const Filters = ({filters,setfilters,maxprice}) => {

    const set = (key,value) => setfilters({...filters,[key]: value});

    const togglediet = (key) => {
        const ALdiet = filters.diets.includes(key) ? filters.diets.filter((d) => d !== key) : [...filters.diets,key];
        set("diets",ALdiet);
    };


    return (
        <div className="filters">
            <input
                type="search"
                className="search"
                placeholder="Search drinks and food..."
                value={filters.search}
                onChange={(e) => set("search",e.target.value)}
                aria-label="Search the menu"
            />

            <div className="chips" role="group" aria-label="Category">
                <button className={filters.category === 0 ? "chip active" : "chip"} onClick={() => set("category",0)}>All</button>
                {ALcategories.map((c) =>
                    <button key={c.id} className={filters.category === c.id ? "chip active" : "chip"} onClick={() => set("category",c.id)}>{c.name}</button>
                )}
            </div>

            <div className="filterrow">
                <div className="diets">
                    {ALdiets.map(([key,label]) =>
                        <label key={key} className="check">
                            <input type="checkbox" checked={filters.diets.includes(key)} onChange={() => togglediet(key)} />
                            {label}
                        </label>
                    )}
                </div>

                <label className="pricefilter">
                    Max price: <strong>${filters.maxprice}</strong>
                    <input type="range" min="3" max={Math.ceil(maxprice)} step="1" value={filters.maxprice} onChange={(e) => set("maxprice",Number(e.target.value))} />
                </label>

                <label className="sortby">
                    Sort
                    <select value={filters.sort} onChange={(e) => set("sort",e.target.value)}>
                        <option value="popular">Most popular</option>
                        <option value="low">Price: low to high</option>
                        <option value="high">Price: high to low</option>
                        <option value="name">Name</option>
                    </select>
                </label>
            </div>
        </div>
    );
};

export default Filters;
