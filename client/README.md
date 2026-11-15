# Customer website (client)

Made by **Rohullah Hussaini**. Runs on http://localhost:5173.

## Pages (`src/layouts`)

| Page | What it does |
|---|---|
| MainPage | Welcome page with an animated coffee cup, today's special and popular items |
| Menu | 4 categories, search, filters (diet, max price) and sorting |
| Cart | Change quantities, pickup or delivery, simulated payment, GST and delivery fee |
| OrderConfirm | Order details and a status tracker (pending → preparing → ready → delivered) |
| Reservation | Book a table. Checks opening hours, past dates and double booking (8 tables per time slot) |
| Events | Book a birthday, team meeting or workshop. 3 days' notice, one event per day |
| Login / Register | Customer accounts |
| Account | Order history, change or cancel reservations, saved preferences |
| About / Contact | Shop story, contact form |

## Components (`src/components`)

Navbar, Footer, MenuCard, Filters, CartItem, FoodIcon, CoffeeCup, and **ChatBot**, the AI assistant.

## AI assistant

`src/data/chatbot.json` holds the questions and answers. `src/js/chatbot.js` matches keywords in the customer's question. Two answers use real data: "What did I order last time?" reads the customer's orders, and "What do you recommend?" uses their order history or the most popular item.

## Where the code is

| Folder | What's in it |
|---|---|
| `src/App.jsx` | All routes, and the state for user, cart, orders and reservations |
| `src/data` | JSON files: cafe info, categories, menu, events, users, orders, chatbot |
| `src/js/storage.js` | Saves data in localStorage and shares it with the admin |
| `src/js/helpers.js` | Money format, dates, opening hours |
| `src/styles` | One CSS file per page |

## React concepts used

Components and props, `useState`, `useEffect`, `useRef`, forms with validation, conditional rendering, list rendering with keys, React Router (routes, URL params like `/order/:id`, query strings like `/menu?category=2`).
