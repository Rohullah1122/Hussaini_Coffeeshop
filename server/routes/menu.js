import {Router} from "express";
import pool from "../db.js";
import {needadmin} from "../middleware/auth.js";
import {filled,isprice,iswhole,sendproblems} from "../middleware/check.js";


const router = Router();


// checks the menu form, used by add and edit
const checkitem = (body) => {
    const errors = {};
    if (!iswhole(body.category_id)) errors.category_id = "Choose a category.";
    if (!filled(body.name,2)) errors.name = "The name needs at least 2 characters.";
    if (!isprice(body.price) || Number(body.price) > 1000) errors.price = "Enter a valid price.";
    if (body.ingredients !== undefined && !Array.isArray(body.ingredients)) errors.ingredients = "Ingredients must be a list.";
    return errors;
};

// the values in the same order as the columns below
// ingredients is a JSON column, so the list is sent as JSON text
const itemvalues = (b) => [
    b.category_id,b.name.trim(),b.description || "",JSON.stringify(b.ingredients || []),b.price,
    !!b.is_vegetarian,!!b.is_vegan,!!b.is_gluten_free,!!b.is_dairy_free,
    b.is_available !== false,!!b.is_special
];

// one item by id, or undefined
const getitem = async (id) => (await pool.query("SELECT * FROM menu_items WHERE id = ?",[id]))[0][0];

// only one item can be today's special, so clear the old one first
const clearspecial = async (exceptid = 0) => {
    await pool.query("UPDATE menu_items SET is_special = false WHERE is_special AND id <> ?",[exceptid]);
};


// menu: get all items (everyone)
router.get("/",async (req,res) => {
    const [rows] = await pool.query("SELECT * FROM menu_items ORDER BY category_id,id");
    res.json(rows);
});


// menu: get one item (everyone)
router.get("/:id",async (req,res) => {
    const item = await getitem(req.params.id);
    if (!item) return res.status(404).json({error: "Menu item not found."});
    res.json(item);
});


// menu: add a new item (admin)
router.post("/",needadmin,async (req,res) => {
    if (sendproblems(res,checkitem(req.body))) return;
    if (req.body.is_special) await clearspecial();

    const [result] = await pool.query(
        `INSERT INTO menu_items (category_id,name,description,ingredients,price,
            is_vegetarian,is_vegan,is_gluten_free,is_dairy_free,is_available,is_special)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        itemvalues(req.body)
    );
    res.status(201).json(await getitem(result.insertId));
});


// menu: edit an item (admin)
router.put("/:id",needadmin,async (req,res) => {
    const {id} = req.params;
    if (sendproblems(res,checkitem(req.body))) return;
    if (!await getitem(id)) return res.status(404).json({error: "Menu item not found."});
    if (req.body.is_special) await clearspecial(id);

    await pool.query(
        `UPDATE menu_items
         SET category_id = ?,name = ?,description = ?,ingredients = ?,price = ?,
             is_vegetarian = ?,is_vegan = ?,is_gluten_free = ?,is_dairy_free = ?,
             is_available = ?,is_special = ?
         WHERE id = ?`,
        [...itemvalues(req.body),id]
    );
    res.json(await getitem(id));
});


// menu: sold out on/off (admin)
router.patch("/:id/available",needadmin,async (req,res) => {
    if (!await getitem(req.params.id)) return res.status(404).json({error: "Menu item not found."});
    await pool.query("UPDATE menu_items SET is_available = NOT is_available WHERE id = ?",[req.params.id]);
    res.json(await getitem(req.params.id));
});


// menu: make an item today's special, or take it off (admin)
router.patch("/:id/special",needadmin,async (req,res) => {
    const {id} = req.params;
    const found = await getitem(id);
    if (!found) return res.status(404).json({error: "Menu item not found."});

    const makespecial = !found.is_special;
    if (makespecial) await clearspecial(id);
    await pool.query("UPDATE menu_items SET is_special = ? WHERE id = ?",[makespecial,id]);

    // send the whole menu back because two items may have changed
    const [rows] = await pool.query("SELECT * FROM menu_items ORDER BY category_id,id");
    res.json(rows);
});


// menu: delete an item (admin). old orders keep the name and price in order_items
router.delete("/:id",needadmin,async (req,res) => {
    const [result] = await pool.query("DELETE FROM menu_items WHERE id = ?",[req.params.id]);
    if (!result.affectedRows) return res.status(404).json({error: "Menu item not found."});
    res.json({ok: true});
});


export default router;
