// Saves and loads data in the browser (localStorage), because Assignment 1 has no server.
// The admin runs inside this site at localhost:5173/admin, so both apps share this same storage:
// an order placed here shows up in the admin, and a status the admin changes shows up here.
const prefix = "hussainis_";


// change this number when the sample JSON changes, so old saved data is cleared once
const VERSION = 2;


export const loaddata = (key,fallback) => {
    try {
        const saved = localStorage.getItem(prefix + key);
        return saved ? JSON.parse(saved) : fallback;
    } catch {
        return fallback;
    }
};


export const savedata = (key,value) => {
    try {
        localStorage.setItem(prefix + key,JSON.stringify(value));
    } catch {
        // storage is full or blocked, the app keeps working without saving
    }
};


export const removedata = (key) => {
    try {
        localStorage.removeItem(prefix + key);
    } catch {
        // nothing to remove
    }
};


// when the other app (in another tab) saves something, update this app too.
// setters looks like {orders: setALorders,menu: setALmenu}
export const watchdata = (setters) => {
    const update = (e) => {
        if (!e.key || !e.key.startsWith(prefix) || e.newValue === null) return;
        const key = e.key.slice(prefix.length);
        if (setters[key]) setters[key](JSON.parse(e.newValue));
    };

    window.addEventListener("storage",update);
    return () => window.removeEventListener("storage",update);
};


export const checkversion = () => {
    try {
        if (loaddata("version",0) === VERSION) return;
        Object.keys(localStorage).filter((k) => k.startsWith(prefix)).forEach((k) => localStorage.removeItem(k));
        savedata("version",VERSION);
    } catch {
        // storage is blocked
    }
};
