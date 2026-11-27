<<<<<<< HEAD
# Admin website (admin)

Made by **[Friend's name]**. Open it at http://localhost:5173/admin (the client must be running too). Login: `admin@hussainis.com` / `admin123`.
=======
# Hussaini's Coffee Shop · Admin website

**Smart Restaurant Management System, Assignment 1 (React frontend).**
Made by **Mohammad Abu Hantash**. The customer website was made by Rohullah Hussaini.

| Part | Made by |
|---|---|
| Customer website (`client/`) | Rohullah Hussaini |
| Admin website (`admin/`) | Mohammad Abu Hantash |

The admin manages the coffee shop: menu, orders, reservations and events, customers and reviews, with a dashboard for sales and feedback.

## Run it

The customer website and the admin website work together, so start both (each in its own terminal):

```bash
cd client          cd admin
npm install        npm install
npm run dev        npm run dev
```

| Website | Open | Demo login |
|---|---|---|
| Customer | http://localhost:5173 | `demo@hussainis.com` / `demo123` (or create an account) |
| Admin | http://localhost:5173/admin | `admin@hussainis.com` / `admin123` |

## How the two websites share data

Assignment 1 has no database. The data starts in JSON files and every change is saved in the browser (localStorage). The browser keeps separate storage for each address, so the admin is opened through the customer website (`localhost:5173/admin`). `client/vite.config.js` sends those pages to the admin app on port 5174, and `admin/vite.config.js` has `base: "/admin/"`. Both websites are then on the same address and share the same storage:

- An order placed on the website shows up in the admin.
- When the admin changes an order status, the customer's order tracker updates.
- Sold-out items and today's special change on the website right away.

`watchdata` in `src/js/storage.js` listens for changes made in the other website's tab.
>>>>>>> 69724f1a0f147acc31d7bc15e65c73293bbd22b8

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

<<<<<<< HEAD
| Folder | What's in it |
=======
| File / folder | What's in it |
>>>>>>> 69724f1a0f147acc31d7bc15e65c73293bbd22b8
|---|---|
| `src/App.jsx` | All routes, the state, and the functions that change data |
| `src/data` | JSON files: admins, menu, orders, reservations, users, reviews |
| `src/js/storage.js` | Saves data in localStorage, shared with the customer website |
| `src/js/helpers.js` | Money format, dates, sample data dates |
| `src/js/sentiment.js` | Scores each review from its words and star rating |
<<<<<<< HEAD
| `vite.config.js` | `base: "/admin/"` so the admin opens at `/admin` |
=======
| `vite.config.js` | Port 5174 and `base: "/admin/"` |
>>>>>>> 69724f1a0f147acc31d7bc15e65c73293bbd22b8

## React concepts used

Components and props, `useState`, `useEffect`, forms with validation, conditional rendering, list rendering with keys, React Router (protected routes, nested routes with `Outlet`, `basename="/admin"`).
<<<<<<< HEAD
=======

## Tech used

React 19, React Router 7, Vite, plain CSS, localStorage. In Assignment 2 an Express server and a database will replace the JSON files and localStorage.
>>>>>>> 69724f1a0f147acc31d7bc15e65c73293bbd22b8
