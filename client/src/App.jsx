import {useEffect,useState} from "react";
import {Routes,Route,Link,useLocation} from "react-router-dom";
import {loaddata,savedata,removedata,watchdata} from "./js/storage.js";
import {seedorders,seedreservations,today} from "./js/helpers.js";
import cafe from "./data/cafe.json";
import seedmenu from "./data/menu.json";
import jsonorders from "./data/orders.json";
import jsonreservations from "./data/reservations.json";
import seedusers from "./data/users.json";

import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import ChatBot from "./components/ChatBot.jsx";
import MainPage from "./layouts/MainPage.jsx";
import Menu from "./layouts/Menu.jsx";
import Cart from "./layouts/Cart.jsx";
import OrderConfirm from "./layouts/OrderConfirm.jsx";
import Reservation from "./layouts/Reservation.jsx";
import Events from "./layouts/Events.jsx";
import About from "./layouts/About.jsx";
import Contact from "./layouts/Contact.jsx";
import Login from "./layouts/Login.jsx";
import Register from "./layouts/Register.jsx";
import Account from "./layouts/Account.jsx";


const App = () => {
    const [user,setuser] = useState(() => loaddata("user",null));
    const [ALusers,setALusers] = useState(() => loaddata("users",seedusers));
    const [ALcart,setALcart] = useState(() => loaddata("cart",[]));
    const [ALorders,setALorders] = useState(() => loaddata("orders",seedorders(jsonorders)));
    const [ALreservations,setALreservations] = useState(() => loaddata("reservations",seedreservations(jsonreservations)));
    const [ALmenu,setALmenu] = useState(() => loaddata("menu",seedmenu));

    const location = useLocation();


    // everything is saved in the browser whenever it changes
    useEffect(() => { savedata("users",ALusers); },[ALusers]);
    useEffect(() => { savedata("cart",ALcart); },[ALcart]);
    useEffect(() => { savedata("orders",ALorders); },[ALorders]);
    useEffect(() => { savedata("reservations",ALreservations); },[ALreservations]);
    useEffect(() => { user ? savedata("user",user) : removedata("user"); },[user]);

    // the admin (another tab) changed something: show it here too.
    // the menu is only changed by the admin, so this site reads it but never saves it
    useEffect(() => watchdata({
        users: setALusers,
        orders: setALorders,
        reservations: setALreservations,
        menu: setALmenu
    }),[]);

    useEffect(() => { window.scrollTo(0,0); },[location.pathname]);


    /* cart  */

    const addtocart = (item) => {
        const found = ALcart.find((c) => c.id === item.id);
        if (found) {
            setALcart(ALcart.map((c) => (c.id === item.id ? {...c,quantity: c.quantity + 1} : c)));
        } else {
            setALcart([...ALcart,{id: item.id,name: item.name,price: item.price,category_id: item.category_id,quantity: 1}]);
        }
    };

    const changeqty = (id,quantity) => {
        if (quantity < 1) return removefromcart(id);
        setALcart(ALcart.map((c) => (c.id === id ? {...c,quantity: Math.min(quantity,20)} : c)));
    };

    const removefromcart = (id) => setALcart(ALcart.filter((c) => c.id !== id));


    /* orders */

    const placeorder = (details) => {
        const subtotal = ALcart.reduce((sum,c) => sum + c.price * c.quantity,0);
        const tax = subtotal * cafe.tax_rate;
        const delivery_fee = details.order_type === "delivery" ? cafe.delivery_fee : 0;

        const order = {
            id: Math.max(1000,...ALorders.map((o) => o.id)) + 1,
            user_id: user ? user.id : null,
            ...details,
            items: ALcart.map((c) => ({menu_item_id: c.id,item_name: c.name,unit_price: c.price,quantity: c.quantity})),
            subtotal: +subtotal.toFixed(2),
            tax: +tax.toFixed(2),
            delivery_fee,
            total: +(subtotal + tax + delivery_fee).toFixed(2),
            status: "pending",
            created_at: new Date().toISOString()
        };

        setALorders([...ALorders,order]);
        setALcart([]);
        return order.id;
    };

    const cancelorder = (id) => setALorders(ALorders.map((o) => (o.id === id ? {...o,status: "cancelled"} : o)));


    /* reservations and events */

    const addreservation = (data) => {
        const booking = {
            id: Math.max(0,...ALreservations.map((r) => r.id)) + 1,
            user_id: user ? user.id : null,
            ...data,
            status: "pending",
            created_at: new Date().toISOString()
        };
        setALreservations([...ALreservations,booking]);
        return booking;
    };

    const updatereservation = (id,changes) =>
        setALreservations(ALreservations.map((r) => (r.id === id ? {...r,...changes} : r)));


    /* accounts */

    const login = (email,password) => {
        const found = ALusers.find((u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password);
        if (!found) return "Wrong email or password.";
        setuser(found);
        return null;
    };

    const register = (data) => {
        if (ALusers.some((u) => u.email.toLowerCase() === data.email.trim().toLowerCase())) return "An account with this email already exists.";
        const newuser = {
            id: Math.max(0,...ALusers.map((u) => u.id)) + 1,
            ...data,
            email: data.email.trim().toLowerCase(),
            role: "customer",
            joined: today(),
            preferences: {favorite: "",milk: "Regular milk"}
        };
        setALusers([...ALusers,newuser]);
        setuser(newuser);
        return null;
    };

    const updateuser = (changes) => {
        const updated = {...user,...changes};
        setuser(updated);
        setALusers(ALusers.map((u) => (u.id === updated.id ? updated : u)));
    };

    const logout = () => setuser(null);


    const cartcount = ALcart.reduce((sum,c) => sum + c.quantity,0);


    return (
        <div className="app">
            <Navbar cartcount={cartcount} user={user} />

            <main className="page">
                <Routes>
                    <Route path="/" element={<MainPage ALmenu={ALmenu} addtocart={addtocart} />} />
                    <Route path="/menu" element={<Menu ALmenu={ALmenu} addtocart={addtocart} ALcart={ALcart} />} />
                    <Route path="/cart" element={<Cart ALcart={ALcart} user={user} changeqty={changeqty} removefromcart={removefromcart} placeorder={placeorder} />} />
                    <Route path="/order/:id" element={<OrderConfirm ALorders={ALorders} />} />
                    <Route path="/reservation" element={<Reservation user={user} ALreservations={ALreservations} addreservation={addreservation} />} />
                    <Route path="/events" element={<Events user={user} ALreservations={ALreservations} addreservation={addreservation} />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/login" element={<Login user={user} login={login} />} />
                    <Route path="/register" element={<Register user={user} register={register} />} />
                    <Route path="/account" element={<Account user={user} ALmenu={ALmenu} ALorders={ALorders} ALreservations={ALreservations} cancelorder={cancelorder} updatereservation={updatereservation} updateuser={updateuser} logout={logout} />} />
                    <Route path="*" element={
                        <section className="container empty">
                            <h1>Page not found</h1>
                            <Link to="/" className="btn">Back to home</Link>
                        </section>
                    } />
                </Routes>
            </main>

            <Footer />
            <ChatBot user={user} ALorders={ALorders} ALmenu={ALmenu} />
        </div>
    );
};

export default App;
