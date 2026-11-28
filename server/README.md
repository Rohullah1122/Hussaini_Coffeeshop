# Hussaini's Coffee Shop · API (Express + MySQL)

Smart Restaurant Management System — Assignment 2 (Node.js Backend)

The backend for our coffee shop. It's a REST API built with **Node.js, Express and MySQL**. The customer website (`client/`) and the admin website (`admin/`) use it to read and save menu items, orders, reservations, events, users, reviews and messages.

## Team

- **Rohullah Hussaini**: login and sessions (JWT), users, orders, reservations
- **Mohammad Abu Hantash**: MySQL database, admin dashboard API, menu and event management

## Run it

You need **Node.js** and **MySQL 8.0** (or newer).

1. **Create the database.** Open the MySQL 8.0 Command Line Client and run:
   ```
   source C:/websites/Hussaini_Coffeeshop/database/hussainis_coffee_mysql.sql
   ```
   This makes the `hussainis_coffee` database with all 11 tables and sample data. Running it again resets everything.
2. **Make your `.env`.** Copy `.env.example` to `.env` and fill in your MySQL root password and a `JWT_SECRET` (any long random text).
3. **Start the server:**
   ```bash
   cd server
   npm install
   npm run dev
   ```
   The API runs on **http://localhost:5000**. Check it with http://localhost:5000/api/menu.

**Demo logins:** `admin@hussainis.com` / `admin123` (admin), `demo@hussainis.com` / `demo123` (customer).

## Login and sessions

`POST /api/auth/login` returns a **JWT token** (valid 7 days). The React apps save it and send it with every request, so users don't have to log in again:

```
Authorization: Bearer <token>
```

| Who | Can do |
|---|---|
| Guest (no token) | see the menu, events and hours, place orders, book tables and events, send messages |
| Customer | everything a guest can + see, change and cancel **only their own** orders and bookings, edit their account, write reviews |
| Admin | everything + manage the menu, events, all orders, all bookings, users, reviews, messages, dashboard |

Passwords are never saved as plain text. They're hashed with **bcrypt**.

## Routes

| Method | URL | Who | What it does |
|---|---|---|---|
| POST | `/api/auth/register` | everyone | create a customer account |
| POST | `/api/auth/login` | everyone | log in, get a token |
| GET | `/api/auth/me` | logged in | who am I |
| GET | `/api/menu` | everyone | all menu items |
| GET | `/api/menu/:id` | everyone | one item |
| POST | `/api/menu` | admin | add an item |
| PUT | `/api/menu/:id` | admin | edit an item |
| PATCH | `/api/menu/:id/available` | admin | sold out on/off |
| PATCH | `/api/menu/:id/special` | admin | today's special on/off |
| DELETE | `/api/menu/:id` | admin | delete an item |
| GET | `/api/cafe/info` · `/hours` · `/categories` | everyone | shop info, opening hours, categories |
| GET | `/api/events` | everyone | event packages |
| POST / PUT / DELETE | `/api/events` · `/api/events/:id` | admin | manage event packages |
| POST | `/api/orders` | everyone | place an order (prices are taken from the database) |
| GET | `/api/orders` | logged in | admin: all orders, customer: own orders |
| GET | `/api/orders/:id` | owner / admin | one order with its items |
| PUT | `/api/orders/:id/items` | owner | change items and quantities (only while pending) |
| PATCH | `/api/orders/:id/cancel` | owner / admin | cancel (only while pending) |
| PATCH | `/api/orders/:id/status` | admin | pending → preparing → ready → delivered |
| GET | `/api/reservations/availability?date=&time=` | everyone | tables left in that slot |
| POST | `/api/reservations` | everyone | book a table or an event |
| GET | `/api/reservations` | logged in | admin: all, customer: own |
| GET | `/api/reservations/:id` | owner / admin | one booking |
| PUT | `/api/reservations/:id` | owner / admin | change date, time, guests, notes (rules checked again) |
| PATCH | `/api/reservations/:id/cancel` | owner / admin | cancel |
| PATCH | `/api/reservations/:id/status` | admin | approve, complete or cancel |
| GET | `/api/users` | admin | all users with order count and spending |
| GET / PUT / DELETE | `/api/users/:id` | self / admin | view, edit or delete an account |
| PATCH | `/api/users/:id/role` | admin | customer ↔ admin |
| GET | `/api/reviews` | everyone | all reviews |
| POST | `/api/reviews` | customer | write a review |
| DELETE | `/api/reviews/:id` | admin | delete a review |
| POST | `/api/messages` | everyone | contact form |
| GET / PATCH | `/api/messages` · `/api/messages/:id` | admin | read messages, mark read |
| GET | `/api/admin/stats` | admin | dashboard numbers: orders today, weekly sales, orders per day, popular items |

## Validation

- Required fields, valid email, prices ≥ 0, quantities 1 to 50, only available menu items.
- Order prices, tax and delivery fee are calculated by the server, never taken from the browser.
- **Reservations:** no past dates, only during opening hours, max 8 guests per table, max 8 tables per time slot (no double booking), one booking per person per slot, events need 3 days' notice, guests within the event's min/max, one event per day.
- Errors come back as `{"error": "message"}` with the right status: 400 invalid, 401 not logged in, 403 not allowed, 404 not found, 409 conflict.

## Database (MySQL)

11 tables, created by `database/hussainis_coffee_mysql.sql`:

| Table | Holds |
|---|---|
| `users` | customers and admins (role), bcrypt password hash, preferences (JSON) |
| `categories` | the 4 menu categories |
| `menu_items` | name, price, ingredients (JSON), diet flags, sold out, today's special |
| `orders` | one row per order: customer, pickup/delivery, subtotal, tax, total, status |
| `order_items` | the items in each order (name and price copied so old orders stay correct) |
| `events` | event packages: price per person, min/max guests, menus (JSON) |
| `reservations` | table and event bookings |
| `reviews` | customer reviews (used by the admin's sentiment page) |
| `contact_messages` | messages from the Contact page |
| `cafe_settings` | shop info, tax rate, delivery fee, tables per time slot |
| `opening_hours` | open and close time for each day |

Some rules are enforced **by the database itself**, so they hold even if a request skips the backend checks:

- **Only one today's special:** `UNIQUE` key on a generated column (`special_flag`).
- **One event per day:** `UNIQUE` key on a generated column (`event_day`).
- **No double booking by the same person:** `UNIQUE` key on email + date + time.
- `CHECK` constraints for prices, ratings, statuses and guest counts.

Saving an order uses a **transaction**: the order and all its items are saved together, or nothing is saved.

## Testing

Every route was tested in **Postman** against MySQL: create, read, update and delete for each part, plus the error cases (no token → 401, duplicate email → 409, double booking → 409, booking outside opening hours → 400).

## Files

```
server/
├── index.js              starts Express, connects the routes, error handler
├── db.js                 MySQL connection pool (mysql2)
├── .env.example          the settings to copy into .env
├── middleware/
│   ├── auth.js           login token: needlogin, needadmin, maybelogin
│   └── check.js          small validation helpers
└── routes/               one file per part of the API
    ├── auth.js  menu.js  cafe.js  events.js  orders.js
    └── reservations.js  users.js  reviews.js  messages.js  admin.js
```
