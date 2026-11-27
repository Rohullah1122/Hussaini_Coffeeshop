import express from "express"; // for creating the server and handling requests
import cors from "cors"; // lets React (port 5173) call this server (port 5000)
import "dotenv/config"; // reads .env so process.env.DB_PASSWORD etc. work

import authroutes from "./routes/auth.js";
import menuroutes from "./routes/menu.js";
import caferoutes from "./routes/cafe.js";
import eventroutes from "./routes/events.js";
import orderroutes from "./routes/orders.js";
import reservationroutes from "./routes/reservations.js";
import userroutes from "./routes/users.js";
import reviewroutes from "./routes/reviews.js";
import messageroutes from "./routes/messages.js";
import adminroutes from "./routes/admin.js";

// check that the JWT secret is set, otherwise the server won't work JWT (JSON Web Token) is used to sign and verify the login token that the server gives to the client when an admin logs in. The client sends it back with every request, so the server knows who is logged in. If you don't set a secret, anyone could make up a token and log in as any admin.
if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is missing in .env. Add a long random text, e.g. JWT_SECRET=hussaini-coffee-change-me-123");
    process.exit(1);
}


const app = express();
app.use(cors());
app.use(express.json()); // puts the JSON that React sends into req.body


// every part of the API has its own file in routes/
app.use("/api/auth",authroutes);
app.use("/api/menu",menuroutes);
app.use("/api/cafe",caferoutes);
app.use("/api/events",eventroutes);
app.use("/api/orders",orderroutes);
app.use("/api/reservations",reservationroutes);
app.use("/api/users",userroutes);
app.use("/api/reviews",reviewroutes);
app.use("/api/messages",messageroutes);
app.use("/api/admin",adminroutes);


// a URL that doesn't exist
app.use((req,res) => {
    res.status(404).json({error: `No route for ${req.method} ${req.url}`});
});


// error handler: Express sends every error here. database errors get a clear message
// instead of crashing the server or showing SQL to the user
const DBMESSAGES = {
    users_email_key: "An account with this email already exists.",
    one_event_per_day: "The event room is already booked that day.",
    one_booking_per_slot: "You already have a booking at that time.",
    one_special: "Only one item can be today's special."
};

app.use((err,req,res,next) => {
    if (err.type === "entity.parse.failed") return res.status(400).json({error: "The request body isn't valid JSON."});
    if (err.code === "23505") return res.status(409).json({error: DBMESSAGES[err.constraint] || "That already exists."});
    if (err.code === "23503") return res.status(400).json({error: "That refers to something that doesn't exist."});
    if (err.code === "23514" || err.code === "22P02" || err.code === "22007" || err.code === "22008") {
        return res.status(400).json({error: "Some of the values aren't valid."});
    }

    console.error(err);
    res.status(500).json({error: "Something went wrong on the server."});
});


app.listen(process.env.PORT || 5000,() => {
    console.log(`Server is running on port ${process.env.PORT || 5000}`);
});
