-- =====================================================================
-- Hussaini's Coffee Shop · MySQL database (Assignment 2)
-- Converted from the PostgreSQL version (see git tag: postgres-version)
--
-- HOW TO RUN IN MySQL Workbench
--   1. Open your Local instance connection
--   2. File > Open SQL Script... and pick this file
--   3. Click the lightning bolt (Execute all) or press Ctrl + Shift + Enter
--
-- Running it again is safe: it drops the tables and makes them fresh.
-- Needs MySQL 8.0.16 or newer (for CHECK constraints).
-- =====================================================================

CREATE DATABASE IF NOT EXISTS hussainis_coffee
    CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE hussainis_coffee;

-- start fresh. foreign key checks off so the order of the drops doesn't matter
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS order_items, orders, reservations, reviews, contact_messages,
    menu_items, categories, events, opening_hours, cafe_settings, users;
SET FOREIGN_KEY_CHECKS = 1;


-- =====================================================================
-- 1. TABLES
-- =====================================================================

-- customers AND admins in one table, told apart by role
CREATE TABLE users (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    full_name       VARCHAR(100) NOT NULL,
    email           VARCHAR(150) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    phone           VARCHAR(30),
    role            VARCHAR(20)  NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','admin')),
    preferences     JSON         NOT NULL DEFAULT (JSON_OBJECT()),
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- the 4 menu categories
CREATE TABLE categories (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(60) NOT NULL UNIQUE,
    short_name      VARCHAR(30) NOT NULL,
    sort_order      INT NOT NULL DEFAULT 0
);

-- everything on the menu
CREATE TABLE menu_items (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    category_id     INT NOT NULL,
    name            VARCHAR(100) NOT NULL,
    description     TEXT,
    ingredients     JSON NOT NULL DEFAULT (JSON_ARRAY()),     -- a list, e.g. ["espresso","milk"]
    price           DECIMAL(6,2) NOT NULL CHECK (price >= 0),
    is_vegetarian   BOOLEAN NOT NULL DEFAULT FALSE,
    is_vegan        BOOLEAN NOT NULL DEFAULT FALSE,
    is_gluten_free  BOOLEAN NOT NULL DEFAULT FALSE,
    is_dairy_free   BOOLEAN NOT NULL DEFAULT FALSE,
    is_special      BOOLEAN NOT NULL DEFAULT FALSE,           -- today's special
    is_available    BOOLEAN NOT NULL DEFAULT TRUE,            -- false = sold out
    popularity      INT NOT NULL DEFAULT 0,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- only one item can be today's special:
    -- this column is 1 for the special and NULL for everything else,
    -- and a UNIQUE column allows many NULLs but only one 1
    special_flag    TINYINT GENERATED ALWAYS AS (IF(is_special, 1, NULL)) STORED,
    UNIQUE KEY one_special (special_flag),

    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
);

-- one order = one row here; the things in it are in order_items
CREATE TABLE orders (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT,
    customer_name   VARCHAR(100) NOT NULL,
    phone           VARCHAR(30)  NOT NULL,
    order_type      VARCHAR(20)  NOT NULL CHECK (order_type IN ('pickup','delivery')),
    address         VARCHAR(255),
    payment         VARCHAR(50)  NOT NULL,
    subtotal        DECIMAL(8,2) NOT NULL,
    tax             DECIMAL(8,2) NOT NULL,
    delivery_fee    DECIMAL(8,2) NOT NULL DEFAULT 0,
    total           DECIMAL(8,2) NOT NULL,
    notes           TEXT,
    status          VARCHAR(20)  NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','preparing','ready','delivered','cancelled')),
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (order_type = 'pickup' OR address IS NOT NULL),     -- delivery needs an address
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) AUTO_INCREMENT = 1001;                                       -- order numbers start at 1001

-- the items inside each order. name and price are copied so old orders
-- stay correct even if the menu changes later
CREATE TABLE order_items (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    order_id        INT NOT NULL,
    menu_item_id    INT,
    item_name       VARCHAR(100) NOT NULL,
    unit_price      DECIMAL(6,2) NOT NULL,
    quantity        INT NOT NULL CHECK (quantity > 0),
    FOREIGN KEY (order_id)     REFERENCES orders(id)     ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE SET NULL
);

-- the event packages (birthday brunch, team meeting, workshop)
CREATE TABLE events (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    name                VARCHAR(100) NOT NULL UNIQUE,
    description         TEXT,
    price_per_person    DECIMAL(6,2) NOT NULL,
    min_guests          INT NOT NULL,
    max_guests          INT NOT NULL,
    menus               JSON NOT NULL DEFAULT (JSON_ARRAY()),  -- a list of menu names
    CHECK (min_guests <= max_guests)
);

-- table bookings AND event bookings, told apart by booking_type
CREATE TABLE reservations (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    user_id             INT,
    booking_type        VARCHAR(10) NOT NULL CHECK (booking_type IN ('table','event')),
    event_id            INT,
    menu                VARCHAR(100),
    estimated_total     DECIMAL(8,2),
    full_name           VARCHAR(100) NOT NULL,
    email               VARCHAR(150) NOT NULL,
    phone               VARCHAR(30)  NOT NULL,
    reservation_date    DATE NOT NULL,
    reservation_time    TIME NOT NULL,
    guests              INT  NOT NULL CHECK (guests > 0),
    notes               TEXT,
    status              VARCHAR(20) NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','confirmed','completed','cancelled')),
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- note: "an event booking needs an event" is checked by the backend.
    -- MySQL doesn't allow a CHECK on event_id because its foreign key uses ON DELETE SET NULL

    -- no double booking, enforced by the database itself.
    -- MySQL has no "UNIQUE ... WHERE", so each rule gets a helper column that is
    -- NULL when the rule doesn't apply (UNIQUE ignores NULLs)

    -- one event per day (the event room)
    event_day   DATE GENERATED ALWAYS AS
                (IF(booking_type = 'event' AND status <> 'cancelled', reservation_date, NULL)) STORED,
    UNIQUE KEY one_event_per_day (event_day),

    -- the same person can't book the same time slot twice
    slot_email  VARCHAR(150) GENERATED ALWAYS AS
                (IF(status <> 'cancelled', LOWER(email), NULL)) STORED,
    UNIQUE KEY one_booking_per_slot (slot_email, reservation_date, reservation_time),

    FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE SET NULL,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL
);

-- customer reviews (the admin's AI sentiment page reads these)
CREATE TABLE reviews (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT,
    name            VARCHAR(100) NOT NULL,
    rating          INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment         TEXT NOT NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- messages from the Contact page
CREATE TABLE contact_messages (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    email           VARCHAR(150) NOT NULL,
    message         TEXT NOT NULL,
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- shop info: exactly one row (id is always 1)
-- `tables` is a reserved word in MySQL, so it always needs backticks around it
CREATE TABLE cafe_settings (
    id                  INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    name                VARCHAR(100) NOT NULL,
    tagline             VARCHAR(255),
    address             VARCHAR(255),
    phone               VARCHAR(30),
    email               VARCHAR(150),
    tax_rate            DECIMAL(4,3) NOT NULL,
    delivery_fee        DECIMAL(6,2) NOT NULL,
    `tables`            INT NOT NULL,           -- tables per time slot
    max_table_guests    INT NOT NULL
);

-- opening hours, one row per day (0 = Sunday ... 6 = Saturday, like JavaScript getDay())
CREATE TABLE opening_hours (
    day_of_week     INT PRIMARY KEY CHECK (day_of_week BETWEEN 0 AND 6),
    day_name        VARCHAR(10) NOT NULL,
    open_time       TIME,                       -- NULL = closed that day
    close_time      TIME
);

-- faster lookups for the pages that filter by these
-- (MySQL already indexes every foreign key column by itself)
CREATE INDEX idx_orders_created     ON orders (created_at);
CREATE INDEX idx_reservations_date  ON reservations (reservation_date);


-- =====================================================================
-- 2. STARTING DATA (the same data as the JSON files from Assignment 1)
-- =====================================================================

-- shop info and hours
INSERT INTO cafe_settings (name, tagline, address, phone, email, tax_rate, delivery_fee, `tables`, max_table_guests) VALUES
    ('Hussaini''s Coffee Shop', 'Fresh coffee, warm pastries, good company.', '123 Main Street, Airdrie, AB', '(403) 555-0199', 'hello@hussainiscoffee.ca', 0.05, 3.99, 8, 8);

INSERT INTO opening_hours (day_of_week, day_name, open_time, close_time) VALUES
    (1, 'Monday', '07:00', '18:00'),
    (2, 'Tuesday', '07:00', '18:00'),
    (3, 'Wednesday', '07:00', '18:00'),
    (4, 'Thursday', '07:00', '20:00'),
    (5, 'Friday', '07:00', '20:00'),
    (6, 'Saturday', '08:00', '20:00'),
    (0, 'Sunday', '09:00', '16:00');

-- users: passwords are bcrypt hashes (MySQL has no bcrypt, so they were made ahead of time).
-- Express checks them with bcrypt.compare(). Logins: admin123 and demo123.
-- the sample customers got a random password: they can't log in, they're just data
INSERT INTO users (id, full_name, email, password_hash, phone, role, preferences, created_at) VALUES
    (1, 'Rohullah Hussaini', 'admin@hussainis.com', '$2b$10$J.nn9VLhV4cg2zr5wVwZfuo4GnHD/Movg/ayUayhB6B7knW0DeGRu', NULL, 'admin', '{}', NOW()),
    (2, 'Demo Customer', 'demo@hussainis.com', '$2b$10$EzdPeDi3rvG0AsX5g9OlzuMrQbxDlMvml5JELccYT3coPN/yTZdSa', '403-555-0100', 'customer', '{"favorite": "Caramel Oat Latte", "milk": "Oat milk"}', '2026-09-02'),
    (3, 'Sarah Brooks', 'sarah@example.com', '$2b$10$iqcb26og7yozEOoVzh3/PuXVNdg6zWKvXA9CC40YeeWfJaD0SSt2K', '403-555-0102', 'customer', '{}', '2026-09-15'),
    (4, 'Ali Karimi', 'ali@example.com', '$2b$10$7Gu3WMPiKfr3AS2FOy.mHuUQiTWvlrXwndeLhbwyxSLfQTZA0fX66', '403-555-0103', 'customer', '{}', '2026-10-01'),
    (5, 'Maya Chen', 'maya@example.com', '$2b$10$Daa3LRL.MRJuiBb61vUPj.0S.pTCBnlXgq88nDEzzpHcwqN71UFle', '403-555-0104', 'customer', '{}', '2026-10-12'),
    (6, 'Jordan Lee', 'jordan@example.com', '$2b$10$tinMhWPjMjDwe2.qwBzfZOn7qi/Xt2I7pdaIDHPIUTOMN9HQ6dp72', '403-555-0105', 'customer', '{}', '2026-11-03');

INSERT INTO categories (id, name, short_name, sort_order) VALUES
    (1, 'Coffee & Drinks', 'Drinks', 1),
    (2, 'Light Bites', 'Starters', 2),
    (3, 'Sandwiches & Bowls', 'Mains', 3),
    (4, 'Pastries & Desserts', 'Desserts', 4);

INSERT INTO menu_items (id, category_id, name, description, ingredients, price, is_vegetarian, is_vegan, is_gluten_free, is_dairy_free, is_special, is_available, popularity) VALUES
    (1, 1, 'Espresso', 'A short, strong shot of our house blend.', JSON_ARRAY('espresso'), 3.25, TRUE, TRUE, TRUE, TRUE, FALSE, TRUE, 60),
    (2, 1, 'Cappuccino', 'Espresso with steamed milk and a thick layer of foam.', JSON_ARRAY('espresso','milk','milk foam'), 4.75, TRUE, FALSE, TRUE, FALSE, FALSE, TRUE, 82),
    (3, 1, 'Caramel Oat Latte', 'Our best seller: espresso, oat milk and house caramel.', JSON_ARRAY('espresso','oat milk','caramel syrup'), 5.95, TRUE, TRUE, TRUE, TRUE, FALSE, TRUE, 99),
    (4, 1, 'Maple Pecan Latte', 'Today''s special: maple syrup, toasted pecan and espresso.', JSON_ARRAY('espresso','milk','maple syrup','pecan'), 6.49, TRUE, FALSE, TRUE, FALSE, TRUE, TRUE, 90),
    (5, 1, 'Matcha Latte', 'Stone-ground green tea whisked with steamed milk.', JSON_ARRAY('matcha','milk','honey'), 5.75, TRUE, FALSE, TRUE, FALSE, FALSE, TRUE, 74),
    (6, 1, 'Iced Cold Brew', 'Coffee steeped for 18 hours, smooth and low in acid.', JSON_ARRAY('cold brew coffee','ice'), 4.95, TRUE, TRUE, TRUE, TRUE, FALSE, TRUE, 77),
    (7, 1, 'Chai Latte', 'Spiced black tea with steamed milk and cinnamon.', JSON_ARRAY('black tea','cinnamon','cardamom','ginger','milk'), 5.25, TRUE, FALSE, TRUE, FALSE, FALSE, TRUE, 69),
    (8, 1, 'Hot Chocolate', 'Rich dark chocolate with steamed milk and whipped cream.', JSON_ARRAY('dark chocolate','milk','whipped cream'), 4.5, TRUE, FALSE, TRUE, FALSE, FALSE, TRUE, 58),
    (9, 2, 'Avocado Toast', 'Smashed avocado, cherry tomatoes and chili flakes on sourdough.', JSON_ARRAY('sourdough','avocado','cherry tomato','chili flakes','olive oil'), 9.95, TRUE, TRUE, FALSE, TRUE, FALSE, TRUE, 88),
    (10, 2, 'Yogurt Parfait', 'Greek yogurt layered with granola, berries and honey.', JSON_ARRAY('greek yogurt','gluten-free granola','berries','honey'), 7.5, TRUE, FALSE, TRUE, FALSE, FALSE, TRUE, 64),
    (11, 2, 'Hummus & Veggie Plate', 'House hummus with crunchy vegetables and pita chips.', JSON_ARRAY('chickpeas','tahini','carrot','cucumber','pita chips'), 8.95, TRUE, TRUE, FALSE, TRUE, FALSE, TRUE, 55),
    (12, 2, 'Tomato Basil Soup', 'Slow-cooked tomato soup with fresh basil and a bread roll.', JSON_ARRAY('tomato','basil','onion','cream','bread roll'), 7.25, TRUE, FALSE, FALSE, FALSE, FALSE, TRUE, 61),
    (13, 3, 'Caprese Panini', 'Fresh mozzarella, tomato, basil and pesto, pressed hot.', JSON_ARRAY('ciabatta','mozzarella','tomato','basil','pesto'), 12.95, TRUE, FALSE, FALSE, FALSE, FALSE, TRUE, 80),
    (14, 3, 'Chicken Pesto Panini', 'Grilled chicken, pesto, roasted peppers and provolone.', JSON_ARRAY('ciabatta','chicken','pesto','roasted peppers','provolone'), 13.95, FALSE, FALSE, FALSE, FALSE, FALSE, TRUE, 85),
    (15, 3, 'Turkey Club', 'Roast turkey, bacon, lettuce and tomato on toasted bread.', JSON_ARRAY('toasted bread','turkey','bacon','lettuce','tomato','mayo'), 13.5, FALSE, FALSE, FALSE, FALSE, FALSE, TRUE, 66),
    (16, 3, 'Garden Quinoa Bowl', 'Quinoa, roasted vegetables, chickpeas and lemon tahini.', JSON_ARRAY('quinoa','roasted vegetables','chickpeas','spinach','lemon tahini'), 13.25, TRUE, TRUE, TRUE, TRUE, FALSE, TRUE, 72),
    (17, 4, 'Chocolate Croissant', 'Buttery croissant with dark chocolate inside. Our most popular dessert.', JSON_ARRAY('butter croissant dough','dark chocolate'), 4.25, TRUE, FALSE, FALSE, FALSE, FALSE, TRUE, 96),
    (18, 4, 'Butter Croissant', 'Flaky, golden and baked fresh every morning.', JSON_ARRAY('flour','butter','yeast'), 3.75, TRUE, FALSE, FALSE, FALSE, FALSE, TRUE, 70),
    (19, 4, 'Gluten-Free Banana Bread', 'Moist banana bread made with gluten-free flour and walnuts.', JSON_ARRAY('banana','gluten-free flour','walnuts','brown sugar'), 4.5, TRUE, FALSE, TRUE, FALSE, FALSE, TRUE, 67),
    (20, 4, 'Blueberry Muffin', 'Soft muffin full of blueberries with a crumble top.', JSON_ARRAY('flour','blueberries','butter','sugar'), 3.95, TRUE, FALSE, FALSE, FALSE, FALSE, TRUE, 63),
    (21, 4, 'Cinnamon Roll', 'Swirled cinnamon dough with cream cheese icing.', JSON_ARRAY('flour','cinnamon','brown sugar','cream cheese'), 4.75, TRUE, FALSE, FALSE, FALSE, FALSE, TRUE, 78),
    (22, 4, 'New York Cheesecake', 'Creamy classic cheesecake with a graham crust.', JSON_ARRAY('cream cheese','graham crust','sugar','eggs'), 6.5, TRUE, FALSE, FALSE, FALSE, FALSE, TRUE, 62);

INSERT INTO events (id, name, description, price_per_person, min_guests, max_guests, menus) VALUES
    (1, 'Birthday Brunch', 'Celebrate with brunch, coffee and cake in our back room. We decorate, you enjoy.', 22, 8, 30, JSON_ARRAY('Classic brunch','Pastries & coffee','Brunch + cake')),
    (2, 'Team Meeting', 'A quiet space with Wi-Fi, a screen, unlimited coffee and lunch for your team.', 15, 4, 20, JSON_ARRAY('Coffee & pastries','Sandwich lunch','Coffee + lunch')),
    (3, 'Latte Art Workshop', 'Learn to steam milk and pour hearts and tulips with our baristas. Two hours, all drinks included.', 35, 4, 12, JSON_ARRAY('Workshop drinks','Workshop + pastries'));

-- sample orders: dates are "X days ago" so the dashboard always shows recent data
INSERT INTO orders (id, user_id, customer_name, phone, order_type, address, payment, subtotal, tax, delivery_fee, total, notes, status, created_at) VALUES
    (1001, 4, 'Ali Karimi', '403-555-0103', 'pickup', NULL, 'Pay at pickup', 9.5, 0.48, 0, 9.98, NULL, 'delivered', TIMESTAMP(CURDATE() - INTERVAL 6 DAY, '07:25:00')),
    (1002, 6, 'Jordan Lee', '403-555-0105', 'pickup', NULL, 'Pay at pickup', 7.5, 0.38, 0, 7.88, NULL, 'delivered', TIMESTAMP(CURDATE() - INTERVAL 6 DAY, '09:35:00')),
    (1003, 2, 'Demo Customer', '403-555-0100', 'pickup', NULL, 'Pay at pickup', 11.9, 0.6, 0, 12.5, NULL, 'delivered', TIMESTAMP(CURDATE() - INTERVAL 6 DAY, '09:15:00')),
    (1004, NULL, 'Tom', '403-555-0199', 'delivery', '45 Bayside Dr, Airdrie, AB', 'Pay online (simulated)', 23.14, 1.16, 3.99, 28.29, NULL, 'delivered', TIMESTAMP(CURDATE() - INTERVAL 6 DAY, '12:35:00')),
    (1005, 3, 'Sarah Brooks', '403-555-0102', 'delivery', '45 Bayside Dr, Airdrie, AB', 'Pay online (simulated)', 33.15, 1.66, 3.99, 38.8, NULL, 'delivered', TIMESTAMP(CURDATE() - INTERVAL 5 DAY, '07:25:00')),
    (1006, 2, 'Demo Customer', '403-555-0100', 'delivery', '45 Bayside Dr, Airdrie, AB', 'Pay online (simulated)', 30.29, 1.51, 3.99, 35.79, NULL, 'delivered', TIMESTAMP(CURDATE() - INTERVAL 5 DAY, '09:25:00')),
    (1007, 5, 'Maya Chen', '403-555-0104', 'pickup', NULL, 'Pay at pickup', 25.2, 1.26, 0, 26.46, NULL, 'delivered', TIMESTAMP(CURDATE() - INTERVAL 5 DAY, '10:45:00')),
    (1008, 5, 'Maya Chen', '403-555-0104', 'delivery', '45 Bayside Dr, Airdrie, AB', 'Pay online (simulated)', 11.7, 0.58, 3.99, 16.27, NULL, 'delivered', TIMESTAMP(CURDATE() - INTERVAL 5 DAY, '11:25:00')),
    (1009, 3, 'Sarah Brooks', '403-555-0102', 'delivery', '45 Bayside Dr, Airdrie, AB', 'Pay online (simulated)', 25.15, 1.26, 3.99, 30.4, NULL, 'delivered', TIMESTAMP(CURDATE() - INTERVAL 5 DAY, '13:55:00')),
    (1010, 4, 'Ali Karimi', '403-555-0103', 'pickup', NULL, 'Pay at pickup', 18.2, 0.91, 0, 19.11, NULL, 'cancelled', TIMESTAMP(CURDATE() - INTERVAL 4 DAY, '07:05:00')),
    (1011, NULL, 'Tom', '403-555-0199', 'pickup', NULL, 'Pay at pickup', 35.15, 1.76, 0, 36.91, NULL, 'delivered', TIMESTAMP(CURDATE() - INTERVAL 4 DAY, '09:25:00')),
    (1012, 3, 'Sarah Brooks', '403-555-0102', 'delivery', '45 Bayside Dr, Airdrie, AB', 'Pay online (simulated)', 20.15, 1.01, 3.99, 25.15, NULL, 'delivered', TIMESTAMP(CURDATE() - INTERVAL 4 DAY, '10:35:00')),
    (1013, 5, 'Maya Chen', '403-555-0104', 'pickup', NULL, 'Pay at pickup', 4.75, 0.24, 0, 4.99, NULL, 'delivered', TIMESTAMP(CURDATE() - INTERVAL 4 DAY, '12:15:00')),
    (1014, 5, 'Maya Chen', '403-555-0104', 'pickup', NULL, 'Pay at pickup', 27.9, 1.4, 0, 29.3, NULL, 'delivered', TIMESTAMP(CURDATE() - INTERVAL 4 DAY, '12:15:00')),
    (1015, 3, 'Sarah Brooks', '403-555-0102', 'pickup', NULL, 'Pay at pickup', 17.74, 0.89, 0, 18.63, NULL, 'delivered', TIMESTAMP(CURDATE() - INTERVAL 4 DAY, '14:35:00')),
    (1016, 6, 'Jordan Lee', '403-555-0105', 'delivery', '45 Bayside Dr, Airdrie, AB', 'Pay online (simulated)', 28.95, 1.45, 3.99, 34.39, NULL, 'cancelled', TIMESTAMP(CURDATE() - INTERVAL 3 DAY, '07:35:00')),
    (1017, NULL, 'Tom', '403-555-0199', 'delivery', '45 Bayside Dr, Airdrie, AB', 'Pay online (simulated)', 13.75, 0.69, 3.99, 18.43, NULL, 'delivered', TIMESTAMP(CURDATE() - INTERVAL 3 DAY, '08:15:00')),
    (1018, 2, 'Demo Customer', '403-555-0100', 'pickup', NULL, 'Pay at pickup', 5.75, 0.29, 0, 6.04, NULL, 'delivered', TIMESTAMP(CURDATE() - INTERVAL 3 DAY, '09:05:00')),
    (1019, 2, 'Demo Customer', '403-555-0100', 'pickup', NULL, 'Pay at pickup', 18.7, 0.94, 0, 19.64, NULL, 'delivered', TIMESTAMP(CURDATE() - INTERVAL 3 DAY, '12:15:00')),
    (1020, NULL, 'Tom', '403-555-0199', 'pickup', NULL, 'Pay at pickup', 38.85, 1.94, 0, 40.79, NULL, 'delivered', TIMESTAMP(CURDATE() - INTERVAL 3 DAY, '13:35:00')),
    (1021, 5, 'Maya Chen', '403-555-0104', 'delivery', '45 Bayside Dr, Airdrie, AB', 'Pay online (simulated)', 14.2, 0.71, 3.99, 18.9, NULL, 'delivered', TIMESTAMP(CURDATE() - INTERVAL 2 DAY, '08:35:00')),
    (1022, NULL, 'Tom', '403-555-0199', 'pickup', NULL, 'Pay at pickup', 7.5, 0.38, 0, 7.88, NULL, 'delivered', TIMESTAMP(CURDATE() - INTERVAL 2 DAY, '09:15:00')),
    (1023, NULL, 'Tom', '403-555-0199', 'pickup', NULL, 'Pay at pickup', 43.7, 2.19, 0, 45.89, NULL, 'delivered', TIMESTAMP(CURDATE() - INTERVAL 2 DAY, '10:15:00')),
    (1024, 4, 'Ali Karimi', '403-555-0103', 'delivery', '45 Bayside Dr, Airdrie, AB', 'Pay online (simulated)', 9.0, 0.45, 3.99, 13.44, NULL, 'delivered', TIMESTAMP(CURDATE() - INTERVAL 2 DAY, '11:45:00')),
    (1025, 3, 'Sarah Brooks', '403-555-0102', 'pickup', NULL, 'Pay at pickup', 9.5, 0.48, 0, 9.98, NULL, 'delivered', TIMESTAMP(CURDATE() - INTERVAL 2 DAY, '13:25:00')),
    (1026, NULL, 'Tom', '403-555-0199', 'pickup', NULL, 'Pay at pickup', 5.95, 0.3, 0, 6.25, NULL, 'delivered', TIMESTAMP(CURDATE() - INTERVAL 2 DAY, '14:55:00')),
    (1027, 6, 'Jordan Lee', '403-555-0105', 'pickup', NULL, 'Pay at pickup', 24.45, 1.22, 0, 25.67, NULL, 'delivered', TIMESTAMP(CURDATE() - INTERVAL 2 DAY, '15:15:00')),
    (1028, 5, 'Maya Chen', '403-555-0104', 'pickup', NULL, 'Pay at pickup', 13.95, 0.7, 0, 14.65, NULL, 'delivered', TIMESTAMP(CURDATE() - INTERVAL 1 DAY, '07:35:00')),
    (1029, NULL, 'Tom', '403-555-0199', 'delivery', '45 Bayside Dr, Airdrie, AB', 'Pay online (simulated)', 16.15, 0.81, 3.99, 20.95, NULL, 'delivered', TIMESTAMP(CURDATE() - INTERVAL 1 DAY, '09:15:00')),
    (1030, 5, 'Maya Chen', '403-555-0104', 'pickup', NULL, 'Pay at pickup', 28.2, 1.41, 0, 29.61, NULL, 'cancelled', TIMESTAMP(CURDATE() - INTERVAL 1 DAY, '09:15:00')),
    (1031, 3, 'Sarah Brooks', '403-555-0102', 'pickup', NULL, 'Pay at pickup', 8.5, 0.43, 0, 8.93, NULL, 'cancelled', TIMESTAMP(CURDATE() - INTERVAL 1 DAY, '11:45:00')),
    (1032, 6, 'Jordan Lee', '403-555-0105', 'pickup', NULL, 'Pay at pickup', 21.95, 1.1, 0, 23.05, NULL, 'delivered', TIMESTAMP(CURDATE() - INTERVAL 1 DAY, '12:55:00')),
    (1033, NULL, 'Tom', '403-555-0199', 'pickup', NULL, 'Pay at pickup', 15.0, 0.75, 0, 15.75, NULL, 'delivered', TIMESTAMP(CURDATE() - INTERVAL 1 DAY, '14:15:00')),
    (1034, 2, 'Demo Customer', '403-555-0100', 'delivery', '45 Bayside Dr, Airdrie, AB', 'Pay online (simulated)', 13.99, 0.7, 3.99, 18.68, NULL, 'pending', TIMESTAMP(CURDATE() - INTERVAL 0 DAY, '08:25:00')),
    (1035, 6, 'Jordan Lee', '403-555-0105', 'delivery', '45 Bayside Dr, Airdrie, AB', 'Pay online (simulated)', 17.2, 0.86, 3.99, 22.05, NULL, 'pending', TIMESTAMP(CURDATE() - INTERVAL 0 DAY, '09:45:00')),
    (1036, 3, 'Sarah Brooks', '403-555-0102', 'delivery', '45 Bayside Dr, Airdrie, AB', 'Pay online (simulated)', 21.75, 1.09, 3.99, 26.83, NULL, 'preparing', TIMESTAMP(CURDATE() - INTERVAL 0 DAY, '09:15:00')),
    (1037, 3, 'Sarah Brooks', '403-555-0102', 'delivery', '45 Bayside Dr, Airdrie, AB', 'Pay online (simulated)', 6.5, 0.33, 3.99, 10.82, NULL, 'preparing', TIMESTAMP(CURDATE() - INTERVAL 0 DAY, '11:45:00')),
    (1038, 2, 'Demo Customer', '403-555-0100', 'pickup', NULL, 'Pay at pickup', 19.5, 0.98, 0, 20.48, NULL, 'ready', TIMESTAMP(CURDATE() - INTERVAL 0 DAY, '12:15:00')),
    (1039, 3, 'Sarah Brooks', '403-555-0102', 'delivery', '45 Bayside Dr, Airdrie, AB', 'Pay online (simulated)', 13.45, 0.67, 3.99, 18.11, NULL, 'delivered', TIMESTAMP(CURDATE() - INTERVAL 0 DAY, '14:05:00')),
    (1040, 5, 'Maya Chen', '403-555-0104', 'delivery', '45 Bayside Dr, Airdrie, AB', 'Pay online (simulated)', 22.5, 1.12, 3.99, 27.61, NULL, 'delivered', TIMESTAMP(CURDATE() - INTERVAL 0 DAY, '16:35:00')),
    (1041, 6, 'Jordan Lee', '403-555-0105', 'delivery', '45 Bayside Dr, Airdrie, AB', 'Pay online (simulated)', 26.98, 1.35, 3.99, 32.32, NULL, 'pending', TIMESTAMP(CURDATE() - INTERVAL 0 DAY, '16:35:00'));

INSERT INTO order_items (order_id, menu_item_id, item_name, unit_price, quantity) VALUES
    (1001, 21, 'Cinnamon Roll', 4.75, 2),
    (1002, 10, 'Yogurt Parfait', 7.5, 1),
    (1003, 3, 'Caramel Oat Latte', 5.95, 2),
    (1004, 3, 'Caramel Oat Latte', 5.95, 2),
    (1004, 21, 'Cinnamon Roll', 4.75, 1),
    (1004, 4, 'Maple Pecan Latte', 6.49, 1),
    (1005, 17, 'Chocolate Croissant', 4.25, 2),
    (1005, 9, 'Avocado Toast', 9.95, 2),
    (1005, 2, 'Cappuccino', 4.75, 1),
    (1006, 3, 'Caramel Oat Latte', 5.95, 4),
    (1006, 4, 'Maple Pecan Latte', 6.49, 1),
    (1007, 5, 'Matcha Latte', 5.75, 1),
    (1007, 9, 'Avocado Toast', 9.95, 1),
    (1007, 2, 'Cappuccino', 4.75, 2),
    (1008, 5, 'Matcha Latte', 5.75, 1),
    (1008, 3, 'Caramel Oat Latte', 5.95, 1),
    (1009, 16, 'Garden Quinoa Bowl', 13.25, 1),
    (1009, 3, 'Caramel Oat Latte', 5.95, 2),
    (1010, 1, 'Espresso', 3.25, 2),
    (1010, 5, 'Matcha Latte', 5.75, 1),
    (1010, 3, 'Caramel Oat Latte', 5.95, 1),
    (1011, 9, 'Avocado Toast', 9.95, 2),
    (1011, 5, 'Matcha Latte', 5.75, 1),
    (1011, 21, 'Cinnamon Roll', 4.75, 2),
    (1012, 17, 'Chocolate Croissant', 4.25, 1),
    (1012, 3, 'Caramel Oat Latte', 5.95, 1),
    (1012, 9, 'Avocado Toast', 9.95, 1),
    (1013, 2, 'Cappuccino', 4.75, 1),
    (1014, 6, 'Iced Cold Brew', 4.95, 2),
    (1014, 16, 'Garden Quinoa Bowl', 13.25, 1),
    (1014, 21, 'Cinnamon Roll', 4.75, 1),
    (1015, 4, 'Maple Pecan Latte', 6.49, 1),
    (1015, 1, 'Espresso', 3.25, 2),
    (1015, 2, 'Cappuccino', 4.75, 1),
    (1016, 14, 'Chicken Pesto Panini', 13.95, 1),
    (1016, 10, 'Yogurt Parfait', 7.5, 2),
    (1017, 21, 'Cinnamon Roll', 4.75, 2),
    (1017, 17, 'Chocolate Croissant', 4.25, 1),
    (1018, 5, 'Matcha Latte', 5.75, 1),
    (1019, 17, 'Chocolate Croissant', 4.25, 3),
    (1019, 3, 'Caramel Oat Latte', 5.95, 1),
    (1020, 13, 'Caprese Panini', 12.95, 3),
    (1021, 9, 'Avocado Toast', 9.95, 1),
    (1021, 17, 'Chocolate Croissant', 4.25, 1),
    (1022, 10, 'Yogurt Parfait', 7.5, 1),
    (1023, 3, 'Caramel Oat Latte', 5.95, 4),
    (1023, 9, 'Avocado Toast', 9.95, 2),
    (1024, 19, 'Gluten-Free Banana Bread', 4.5, 2),
    (1025, 21, 'Cinnamon Roll', 4.75, 2),
    (1026, 3, 'Caramel Oat Latte', 5.95, 1),
    (1027, 5, 'Matcha Latte', 5.75, 2),
    (1027, 13, 'Caprese Panini', 12.95, 1),
    (1028, 14, 'Chicken Pesto Panini', 13.95, 1),
    (1029, 3, 'Caramel Oat Latte', 5.95, 2),
    (1029, 17, 'Chocolate Croissant', 4.25, 1),
    (1030, 14, 'Chicken Pesto Panini', 13.95, 1),
    (1030, 21, 'Cinnamon Roll', 4.75, 3),
    (1031, 17, 'Chocolate Croissant', 4.25, 2),
    (1032, 13, 'Caprese Panini', 12.95, 1),
    (1032, 19, 'Gluten-Free Banana Bread', 4.5, 2),
    (1033, 10, 'Yogurt Parfait', 7.5, 2),
    (1034, 4, 'Maple Pecan Latte', 6.49, 1),
    (1034, 10, 'Yogurt Parfait', 7.5, 1),
    (1035, 17, 'Chocolate Croissant', 4.25, 1),
    (1035, 13, 'Caprese Panini', 12.95, 1),
    (1036, 17, 'Chocolate Croissant', 4.25, 2),
    (1036, 10, 'Yogurt Parfait', 7.5, 1),
    (1036, 5, 'Matcha Latte', 5.75, 1),
    (1037, 1, 'Espresso', 3.25, 2),
    (1038, 10, 'Yogurt Parfait', 7.5, 2),
    (1038, 19, 'Gluten-Free Banana Bread', 4.5, 1),
    (1039, 3, 'Caramel Oat Latte', 5.95, 1),
    (1039, 10, 'Yogurt Parfait', 7.5, 1),
    (1040, 10, 'Yogurt Parfait', 7.5, 3),
    (1041, 1, 'Espresso', 3.25, 2),
    (1041, 4, 'Maple Pecan Latte', 6.49, 2),
    (1041, 10, 'Yogurt Parfait', 7.5, 1);

-- sample bookings: dates are "X days from today"
INSERT INTO reservations (id, user_id, booking_type, event_id, menu, estimated_total, full_name, email, phone, reservation_date, reservation_time, guests, notes, status) VALUES
    (1, 2, 'table', NULL, NULL, NULL, 'Demo Customer', 'demo@hussainis.com', '403-555-0100', CURDATE() + INTERVAL 0 DAY, '12:30', 2, 'Window seat please', 'confirmed'),
    (2, 3, 'table', NULL, NULL, NULL, 'Sarah Brooks', 'sarah@example.com', '403-555-0102', CURDATE() + INTERVAL 1 DAY, '09:00', 4, NULL, 'pending'),
    (3, NULL, 'table', NULL, NULL, NULL, 'Daniel Ortiz', 'daniel@example.com', '403-555-0110', CURDATE() + INTERVAL 2 DAY, '10:30', 3, 'High chair', 'pending'),
    (4, 4, 'event', 1, 'Brunch + cake', 330, 'Ali Karimi', 'ali@example.com', '403-555-0103', CURDATE() + INTERVAL 6 DAY, '11:00', 15, 'Chocolate cake, balloons', 'pending'),
    (5, 5, 'event', 2, 'Coffee + lunch', 150, 'Maya Chen', 'maya@example.com', '403-555-0104', CURDATE() + INTERVAL 9 DAY, '13:00', 10, 'Need the screen', 'confirmed'),
    (6, 6, 'event', 3, 'Workshop + pastries', 280, 'Jordan Lee', 'jordan@example.com', '403-555-0105', CURDATE() + INTERVAL 13 DAY, '15:00', 8, NULL, 'pending'),
    (7, 3, 'table', NULL, NULL, NULL, 'Sarah Brooks', 'sarah@example.com', '403-555-0102', CURDATE() - INTERVAL 3 DAY, '08:30', 2, NULL, 'completed');

INSERT INTO reviews (id, name, rating, comment, created_at) VALUES
    (1, 'Sarah B.', 5, 'Best caramel oat latte in town. Friendly staff and a cozy place to study.', NOW() - INTERVAL 1 DAY),
    (2, 'Ali K.', 4, 'Great croissants and fast pickup. A bit busy on Saturday morning.', NOW() - INTERVAL 2 DAY),
    (3, 'Maya C.', 5, 'We had our team meeting here, the lunch was delicious and the service was amazing.', NOW() - INTERVAL 3 DAY),
    (4, 'Jordan L.', 2, 'My delivery was late and the coffee was cold.', NOW() - INTERVAL 4 DAY),
    (5, 'Priya S.', 5, 'Love the gluten-free banana bread! Finally a cafe that cares.', NOW() - INTERVAL 5 DAY),
    (6, 'Tom R.', 3, 'Coffee was good but the wait was long and the music was loud.', NOW() - INTERVAL 6 DAY),
    (7, 'Emma W.', 4, 'Nice avocado toast, friendly barista. Would come back.', NOW() - INTERVAL 8 DAY),
    (8, 'Chris P.', 1, 'Rude cashier and my order was wrong. Disappointed.', NOW() - INTERVAL 10 DAY);


-- =====================================================================
-- 3. CHECK IT WORKED: you should see a count for every table
-- (no need to reset id counters like in PostgreSQL: MySQL moves
--  AUTO_INCREMENT past the highest id by itself)
-- =====================================================================
SELECT 'users' AS table_name, COUNT(*) AS total FROM users
UNION ALL SELECT 'categories',   COUNT(*) FROM categories
UNION ALL SELECT 'menu_items',   COUNT(*) FROM menu_items
UNION ALL SELECT 'orders',       COUNT(*) FROM orders
UNION ALL SELECT 'order_items',  COUNT(*) FROM order_items
UNION ALL SELECT 'events',       COUNT(*) FROM events
UNION ALL SELECT 'reservations', COUNT(*) FROM reservations
UNION ALL SELECT 'reviews',      COUNT(*) FROM reviews
UNION ALL SELECT 'opening_hours',COUNT(*) FROM opening_hours;
