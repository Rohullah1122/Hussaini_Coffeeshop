import {Outlet} from "react-router-dom";
import Sidebar from "./Sidebar.jsx";


const Layout = ({admin,logout,resetdemo,ALorders,ALreservations}) => {
    const pendingorders = ALorders.filter((o) => o.status === "pending").length;
    const pendingbookings = ALreservations.filter((r) => r.status === "pending").length;


    return (
        <div className="shell">
            <Sidebar admin={admin} logout={logout} resetdemo={resetdemo} pendingorders={pendingorders} pendingbookings={pendingbookings} />
            <main className="content">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
