# Admin website (admin)

Made by **[Friend's name]**. Open it at http://localhost:5173/admin (the client must be running too). Login: `admin@hussainis.com` / `admin123`.

## Pages (`src/layouts`)

| Page | What it does |
|---|---|
| Login | Admin login. Every other page is protected |
| Dashboard | Orders today, weekly sales, open orders, orders-per-day chart, popular items, upcoming bookings, feedback summary |
| MenuManager | Add, edit and delete menu items, sold out on/off, today's special |
| Orders | Filter and search orders, view details, change status (pending → preparing → ready → delivered) |
| Reservations | Tables and events: approve, complete or cancel |
| Customers | Each customer's orders and spending, change role, delete |
| Reviews | Star ratings with **AI sentiment analysis** (positive, mixed, negative) |

## Components (`src/components`)

Layout (sidebar + page), Sidebar, **ProtectedRoute** (sends you to login if you aren't logged in), StatCard, StatusBadge, MenuForm (the add/edit menu popup).

## Where the code is

| Folder | What's in it |
|---|---|
| `src/App.jsx` | All routes, the state, and the functions that change data |
| `src/data` | JSON files: admins, menu, orders, reservations, users, reviews |
| `src/js/storage.js` | Saves data in localStorage, shared with the customer website |
| `src/js/helpers.js` | Money format, dates, sample data dates |
| `src/js/sentiment.js` | Scores each review from its words and star rating |
| `vite.config.js` | `base: "/admin/"` so the admin opens at `/admin` |

## React concepts used

Components and props, `useState`, `useEffect`, forms with validation, conditional rendering, list rendering with keys, React Router (protected routes, nested routes with `Outlet`, `basename="/admin"`).
