import React from "react";
import ReactDOM from "react-dom/client";
import {BrowserRouter} from "react-router-dom";
import {checkversion} from "./js/storage.js";
import "./styles/index.css";
import App from "./App.jsx";


// clears old saved data once when the sample JSON changes
checkversion();


ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </React.StrictMode>
);
