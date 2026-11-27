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
const itemvalues = (b) => [
    b.category_id,b.name.trim(),b.description || "",b.ingredients || [],b.price,
    !!b.is_vegetarian,!!b.is_vegan,!!b.is_gluten_free,!!b.is_dairy_free,
    b.is_available !== false,!!b.is_special
];

// only one item can be today's special, so clear the old one first
const clearspecial = async (exceptid = 0) => {
    await pool.query("UPDATE menu_items SET is_special = false WHERE is_special AND id <> $1",[exceptid]);
};


// menu: get all items (everyone)
router.get("/",async (req,res) => {
    const result = await pool.query("SELECT * FROM menu_items ORDER BY category_id,id");
    res.json(result.rows);
});


// menu: get one item (everyone)
router.get("/:id",async (req,res) => {
    const result = await pool.query("SELECT * FROM menu_items WHERE id = $1",[req.params.id]);
    if (!result.rows.length) return res.status(404).json({error: "Menu item not found."});
    res.json(result.rows[0]);
});


// menu: add a new item (admin)
router.post("/",needadmin,async (req,res) => {
    if (sendproblems(res,checkitem(req.body))) return;
    if (req.body.is_special) await clearspecial();

    const result = await pool.query(
        `INSERT INTO menu_items (category_id,name,description,ingredients,price,
            is_vegetarian,is_vegan,is_gluten_free,is_dairy_free,is_available,is_special)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
        itemvalues(req.body)
    );
    res.status(201).json(result.rows[0]);
});


// menu: edit an item (admin)
router.put("/:id",needadmin,async (req,res) => {
    const {id} = req.params;
    if (sendproblems(res,checkitem(req.body))) return;
    if (req.body.is_special) await clearspecial(id);

    const result = await pool.query(
        `UPDATE menu_items
         SET category_id = $1,name = $2,description = $3,ingredients = $4,price = $5,
             is_vegetarian = $6,is_vegan = $7,is_gluten_free = $8,is_dairy_free = $9,
             is_available = $10,is_special = $11
         WHERE id = $12
         RETURNING *`,
        [...itemvalues(req.body),id]
    );

    if (!result.rows.length) return res.status(404).json({error: "Menu item not found."});
    res.json(result.rows[0]);
});


// menu: sold out on/off (admin)
router.patch("/:id/available",needadmin,async (req,res) => {
    const result = await pool.query(
        "UPDATE menu_items SET is_available = NOT is_available WHERE id = $1 RETURNING *",
        [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({error: "Menu item not found."});
    res.json(result.rows[0]);
});


// menu: make an item today's special, or take it off (admin)
router.patch("/:id/special",needadmin,async (req,res) => {
    const {id} = req.params;
    const found = await pool.query("SELECT is_special FROM menu_items WHERE id = $1",[id]);
    if (!found.rows.length) return res.status(404).json({error: "Menu item not found."});

    const makespecial = !found.rows[0].is_special;
    if (makespecial) await clearspecial(id);
    await pool.query("UPDATE menu_items SET is_special = $1 WHERE id = $2",[makespecial,id]);

    // send the whole menu back because two items may have changed
    const result = await pool.query("SELECT * FROM menu_items ORDER BY category_id,id");
    res.json(result.rows);
});


// menu: delete an item (admin). old orders keep the name and price in order_items
router.delete("/:id",needadmin,async (req,res) => {
    const result = await pool.query("DELETE FROM menu_items WHERE id = $1",[req.params.id]);
    if (!result.rowCount) return res.status(404).json({error: "Menu item not found."});
    res.json({ok: true});
});


export default router;
