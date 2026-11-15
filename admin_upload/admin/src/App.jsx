import {useEffect,useState} from "react";
import {Routes,Route,Navigate} from "react-router-dom";
import {loaddata,savedata,removedata,watchdata} from "./js/storage.js";
import {seedorders,seedreservations,seedreviews} from "./js/helpers.js";

import ALadmins from "./data/admins.json";
import seedmenu from "./data/menu.json";
import jsonorders from "./data/orders.json";
import jsonreservations from "./data/reservations.json";
import seedusers from "./data/users.json";
import jsonreviews from "./data/reviews.json";

import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Layout from "./components/Layout.jsx";
import Login from "./layouts/Login.jsx";
import Dashboard from "./layouts/Dashboard.jsx";
import MenuManager from "./layouts/MenuManager.jsx";
import Orders from "./layouts/Orders.jsx";
import Reservations from "./layouts/Reservations.jsx";
import Customers from "./layouts/Customers.jsx";
import Reviews from "./layouts/Reviews.jsx";


const App = () => {
    const [admin,setadmin] = useState(() => loaddata("admin",null));
    const [ALmenu,setALmenu] = useState(() => loaddata("menu",seedmenu));
    const [ALorders,setALorders] = useState(() => loaddata("orders",seedorders(jsonorders)));
    const [ALreservations,setALreservations] = useState(() => loaddata("reservations",seedreservations(jsonreservations)));
    const [ALusers,setALusers] = useState(() => loaddata("users",seedusers));
    const [ALreviews,setALreviews] = useState(() => loaddata("reviews",seedreviews(jsonreviews)));


    useEffect(() => { savedata("menu",ALmenu); },[ALmenu]);
    useEffect(() => { savedata("orders",ALorders); },[ALorders]);
    useEffect(() => { savedata("reservations",ALreservations); },[ALreservations]);
    useEffect(() => { savedata("users",ALusers); },[ALusers]);
    useEffect(() => { savedata("reviews",ALreviews); },[ALreviews]);
    useEffect(() => { admin ? savedata("admin",admin) : removedata("admin"); },[admin]);

    // a customer ordered, booked or signed up on the website (another tab): show it here right away
    useEffect(() => watchdata({
        menu: setALmenu,
        orders: setALorders,
        reservations: setALreservations,
        users: setALusers
    }),[]);


    /* ---------- login ---------- */

    const login = (email,password) => {
        const found = ALadmins.find((a) => a.email === email.trim().toLowerCase() && a.password === password);
        if (!found) return "Wrong email or password.";
        setadmin({id: found.id,full_name: found.full_name,email: found.email});
        return null;
    };

    const logout = () => setadmin(null);


    /* ---------- menu ---------- */

    const savemenuitem = (item) => {
        // a new special takes the place of the old one
        const ALothers = item.is_special ? ALmenu.map((m) => ({...m,is_special: false})) : ALmenu;

        if (item.id) {
            setALmenu(ALothers.map((m) => (m.id === item.id ? item : m)));
        } else {
            setALmenu([...ALothers,{...item,id: Math.max(0,...ALmenu.map((m) => m.id)) + 1,popularity: 50}]);
        }
    };

    const deletemenuitem = (id) => setALmenu(ALmenu.filter((m) => m.id !== id));

    const toggleavailable = (id) => setALmenu(ALmenu.map((m) => (m.id === id ? {...m,is_available: !m.is_available} : m)));

    // only one item can be today's special
    const setspecial = (id) => setALmenu(ALmenu.map((m) => ({...m,is_special: m.id === id ? !m.is_special : false})));


    /* ---------- orders, bookings, users, reviews ---------- */

    const setorderstatus = (id,status) => setALorders(ALorders.map((o) => (o.id === id ? {...o,status} : o)));

    const setbookingstatus = (id,status) => setALreservations(ALreservations.map((r) => (r.id === id ? {...r,status} : r)));

    const setuserrole = (id,role) => setALusers(ALusers.map((u) => (u.id === id ? {...u,role} : u)));

    const deleteuser = (id) => setALusers(ALusers.filter((u) => u.id !== id));

    const deletereview = (id) => setALreviews(ALreviews.filter((r) => r.id !== id));


    // puts the sample data back (useful before recording the demo video)
    const resetdemo = () => {
        setALmenu(seedmenu);
        setALorders(seedorders(jsonorders));
        setALreservations(seedreservations(jsonreservations));
        setALusers(seedusers);
        setALreviews(seedreviews(jsonreviews));
    };


    return (
        <Routes>
            <Route path="/login" element={<Login admin={admin} login={login} />} />

            <Route element={
                <ProtectedRoute admin={admin}>
                    <Layout admin={admin} logout={logout} resetdemo={resetdemo} ALorders={ALorders} ALreservations={ALreservations} />
                </ProtectedRoute>
            }>
                <Route path="/" element={<Dashboard ALorders={ALorders} ALreservations={ALreservations} ALmenu={ALmenu} ALreviews={ALreviews} />} />
                <Route path="/menu" element={<MenuManager ALmenu={ALmenu} savemenuitem={savemenuitem} deletemenuitem={deletemenuitem} toggleavailable={toggleavailable} setspecial={setspecial} />} />
                <Route path="/orders" element={<Orders ALorders={ALorders} setorderstatus={setorderstatus} />} />
                <Route path="/reservations" element={<Reservations ALreservations={ALreservations} setbookingstatus={setbookingstatus} />} />
                <Route path="/customers" element={<Customers ALusers={ALusers} ALorders={ALorders} setuserrole={setuserrole} deleteuser={deleteuser} />} />
                <Route path="/reviews" element={<Reviews ALreviews={ALreviews} deletereview={deletereview} />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default App;
