import {Router} from "express";
import pool from "../db.js";
import {maybelogin,needlogin,needadmin} from "../middleware/auth.js";
import {filled,iswhole,sendproblems} from "../middleware/check.js";


const router = Router();

const STATUSES = ["pending","preparing","ready","delivered","cancelled"];


// looks up the real prices in the database (never trust prices sent by the browser).
// ALitems looks like [{menu_item_id: 3,quantity: 2}]
const priceitems = async (ALitems) => {
    if (!Array.isArray(ALitems) || !ALitems.length) return {error: "Your cart is empty."};
    if (!ALitems.every((i) => iswhole(i.menu_item_id) && iswhole(i.quantity) && Number(i.quantity) <= 50)) {
        return {error: "Each item needs a valid quantity (1 to 50)."};
    }

    const ids = ALitems.map((i) => Number(i.menu_item_id));
    const result = await pool.query("SELECT id,name,price,is_available FROM menu_items WHERE id = ANY($1)",[ids]);

    const ALlines = [];
    for (const i of ALitems) {
        const item = result.rows.find((m) => m.id === Number(i.menu_item_id));
        if (!item) return {error: "One of the items isn't on the menu anymore."};
        if (!item.is_available) return {error: `${item.name} is sold out.`};
        ALlines.push({menu_item_id: item.id,item_name: item.name,unit_price: item.price,quantity: Number(i.quantity)});
    }

    const subtotal = ALlines.reduce((sum,l) => sum + l.unit_price * l.quantity,0);
    return {ALlines,subtotal};
};

// subtotal → tax, delivery fee and total, using the rates saved in cafe_settings
const totals = async (subtotal,order_type) => {
    const cafe = (await pool.query("SELECT tax_rate,delivery_fee FROM cafe_settings WHERE id = 1")).rows[0];
    const round = (n) => Math.round(n * 100) / 100;
    const tax = round(subtotal * cafe.tax_rate);
    const delivery_fee = order_type === "delivery" ? cafe.delivery_fee : 0;
    return {subtotal: round(subtotal),tax,delivery_fee,total: round(subtotal + tax + delivery_fee)};
};

// one order with its items inside
const getorder = async (id) => {
    const order = await pool.query("SELECT * FROM orders WHERE id = $1",[id]);
    if (!order.rows.length) return null;
    const items = await pool.query("SELECT menu_item_id,item_name,unit_price,quantity FROM order_items WHERE order_id = $1 ORDER BY id",[id]);
    return {...order.rows[0],items: items.rows};
};

// admins see every order, customers only their own, guests only guest orders (by the number on their receipt)
const cansee = (user,order) => (user && user.role === "admin") || (user ? order.user_id === user.id : order.user_id === null);


// orders: place a new order (customers and guests)
router.post("/",maybelogin,async (req,res) => {
    const b = req.body;

    const errors = {};
    if (!["pickup","delivery"].includes(b.order_type)) errors.order_type = "Choose pickup or delivery.";
    if (!filled(b.customer_name,2) && !req.user) errors.customer_name = "Please enter your name.";
    if (!filled(b.phone,7)) errors.phone = "Please enter a phone number.";
    if (b.order_type === "delivery" && !filled(b.address,5)) errors.address = "Please enter the delivery address.";
    if (sendproblems(res,errors)) return;

    const priced = await priceitems(b.items);
    if (priced.error) return res.status(400).json({error: priced.error});
    const money = await totals(priced.subtotal,b.order_type);

    // a transaction: the order and all its items are saved together, or nothing is saved
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const order = await client.query(
            `INSERT INTO orders (user_id,customer_name,phone,order_type,address,payment,subtotal,tax,delivery_fee,total,notes)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
            [req.user ? req.user.id : null,req.user ? req.user.full_name : b.customer_name.trim(),b.phone.trim(),b.order_type,
             b.order_type === "delivery" ? b.address.trim() : null,b.payment || "Pay at pickup",
             money.subtotal,money.tax,money.delivery_fee,money.total,b.notes || ""]
        );
        const orderid = order.rows[0].id;

        for (const l of priced.ALlines) {
            await client.query(
                "INSERT INTO order_items (order_id,menu_item_id,item_name,unit_price,quantity) VALUES ($1,$2,$3,$4,$5)",
                [orderid,l.menu_item_id,l.item_name,l.unit_price,l.quantity]
            );
            await client.query("UPDATE menu_items SET popularity = popularity + $1 WHERE id = $2",[l.quantity,l.menu_item_id]);
        }

        await client.query("COMMIT");
        res.status(201).json(await getorder(orderid));
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
});


// orders: list (admin sees all, a customer sees only their own)
router.get("/",needlogin,async (req,res) => {
    const isadmin = req.user.role === "admin";
    const result = await pool.query(
        `SELECT o.*,
            COALESCE(json_agg(json_build_object('menu_item_id',i.menu_item_id,'item_name',i.item_name,
                'unit_price',i.unit_price,'quantity',i.quantity) ORDER BY i.id) FILTER (WHERE i.id IS NOT NULL),'[]') AS items
         FROM orders o
         LEFT JOIN order_items i ON i.order_id = o.id
         ${isadmin ? "" : "WHERE o.user_id = $1"}
         GROUP BY o.id
         ORDER BY o.created_at DESC`,
        isadmin ? [] : [req.user.id]
    );
    res.json(result.rows);
});


// orders: one order with its items (owner, admin, or the guest who placed it)
router.get("/:id",maybelogin,async (req,res) => {
    const order = await getorder(req.params.id);
    if (!order || !cansee(req.user,order)) return res.status(404).json({error: "Order not found."});
    res.json(order);
});


// orders: change the items or quantities, only while the order is still pending (owner)
router.put("/:id/items",needlogin,async (req,res) => {
    const order = await getorder(req.params.id);
    if (!order || order.user_id !== req.user.id) return res.status(404).json({error: "Order not found."});
    if (order.status !== "pending") return res.status(409).json({error: "This order is already being made and can't be changed."});

    const priced = await priceitems(req.body.items);
    if (priced.error) return res.status(400).json({error: priced.error});
    const money = await totals(priced.subtotal,order.order_type);

    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await client.query("DELETE FROM order_items WHERE order_id = $1",[order.id]);
        for (const l of priced.ALlines) {
            await client.query(
                "INSERT INTO order_items (order_id,menu_item_id,item_name,unit_price,quantity) VALUES ($1,$2,$3,$4,$5)",
                [order.id,l.menu_item_id,l.item_name,l.unit_price,l.quantity]
            );
        }
        await client.query(
            "UPDATE orders SET subtotal = $1,tax = $2,delivery_fee = $3,total = $4 WHERE id = $5",
            [money.subtotal,money.tax,money.delivery_fee,money.total,order.id]
        );
        await client.query("COMMIT");
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }

    res.json(await getorder(order.id));
});


// orders: customer cancels their own order (only while pending)
router.patch("/:id/cancel",needlogin,async (req,res) => {
    const order = await getorder(req.params.id);
    if (!order || (order.user_id !== req.user.id && req.user.role !== "admin")) return res.status(404).json({error: "Order not found."});
    if (order.status !== "pending") return res.status(409).json({error: "Only pending orders can be cancelled."});

    await pool.query("UPDATE orders SET status = 'cancelled' WHERE id = $1",[order.id]);
    res.json(await getorder(order.id));
});


// orders: admin moves the status along (pending → preparing → ready → delivered)
router.patch("/:id/status",needadmin,async (req,res) => {
    const {status} = req.body;
    if (!STATUSES.includes(status)) return res.status(400).json({error: "Unknown status."});

    const result = await pool.query("UPDATE orders SET status = $1 WHERE id = $2 RETURNING id",[status,req.params.id]);
    if (!result.rows.length) return res.status(404).json({error: "Order not found."});
    res.json(await getorder(req.params.id));
});


export default router;
