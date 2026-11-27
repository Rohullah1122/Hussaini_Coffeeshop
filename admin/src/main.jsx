import React from "react";
import ReactDOM from "react-dom/client";
import {BrowserRouter} from "react-router-dom";
import {checkversion} from "./js/storage.js";
import "./styles/index.css";
import App from "./App.jsx";


// the admin has to be opened through the customer site so both share the same storage
if (window.location.port === "5174") {
    window.location.replace("http://localhost:5173" + window.location.pathname + window.location.search);
}

checkversion();


ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <BrowserRouter basename="/admin">
            <App />
        </BrowserRouter>
    </React.StrictMode>
);
