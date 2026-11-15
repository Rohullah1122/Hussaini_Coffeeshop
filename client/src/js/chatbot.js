// The "AI" assistant: matches keywords from chatbot.json, and looks at real data for some answers
import ALanswers from "../data/chatbot.json";
import cafe from "../data/cafe.json";
import {money,prettytime} from "./helpers.js";


const lastorder = (user,ALorders) => {
    if (!user) return "Log in and I can tell you what you ordered last time.";

    const ALmine = ALorders
        .filter((o) => o.user_id === user.id)
        .sort((a,b) => new Date(b.created_at) - new Date(a.created_at));

    if (!ALmine.length) return "You haven't ordered yet. Our Caramel Oat Latte is a great first pick!";

    const names = ALmine[0].items.map((i) => (i.quantity > 1 ? i.quantity + "x " : "") + i.item_name);
    return "Your previous order was " + names.join(" and ") + ".";
};


// customers with history get their favorite, everyone else gets the most popular drink
const recommend = (user,ALorders,ALmenu) => {
    const ALmine = user ? ALorders.filter((o) => o.user_id === user.id) : [];


    //recommend based on previous orders history
    if (ALmine.length) {
        const counts = {};
        ALmine.forEach((o) => o.items.forEach((i) => { counts[i.item_name] = (counts[i.item_name] || 0) + i.quantity; }));
        const fav = Object.keys(counts).sort((a,b) => counts[b] - counts[a])[0];
        return "Based on your orders, you love the " + fav + ". Want to try today's Maple Pecan Latte too?";
    }

    //recommend based on popularity
    const top = [...ALmenu].filter((m) => m.is_available).sort((a,b) => b.popularity - a.popularity)[0];
    return "Based on popular orders, we recommend our " + top.name + " (" + money(top.price) + ").";
};

// returns today's hours in a friendly format
const hours = () => {
    const day = new Date().toLocaleDateString("en-US",{weekday: "long"});
    const h = cafe.hours.find((x) => x.day === day);
    return "Today (" + day + ") we're open " + prettytime(h.open) + " to " + prettytime(h.close) + ".";
};


// returns a reply based on the user's message, or a default if no match
export const getreply = (text,user,ALorders,ALmenu) => {
    const msg = text.toLowerCase();
    const match = ALanswers.find((a) => a.keywords.some((k) => msg.includes(k)));

    if (!match) return "Sorry, I'm still learning! Try asking about today's special, vegetarian or gluten-free options, or your last order.";
    if (match.answer === "LAST_ORDER") return lastorder(user,ALorders);
    if (match.answer === "RECOMMEND") return recommend(user,ALorders,ALmenu);
    if (match.answer === "HOURS") return hours();
    return match.answer;
};

// quick questions for the user to click on instead of typing
export const QUICK = [
    "What are today's specials?",
    "What vegetarian meals do you have?",
    "What do you recommend?",
    "Do you have gluten-free options?",
    "What is the most popular dessert?",
    "What did I order last time?"
];
