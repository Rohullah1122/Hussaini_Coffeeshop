import cafe from "../data/cafe.json";


export const money = (n) => "$" + Number(n).toFixed(2);


export const STEPS = ["pending","preparing","ready","delivered"];

// returns a label for the order status, e.g. "on the way" instead of "ready" for delivery orders
export const steplabel = (status,ordertype) => {
    if (status === "ready" && ordertype === "delivery") return "on the way";
    if (status === "delivered" && ordertype === "pickup") return "picked up";
    return status;
};


// opening hours for a date like "2026-11-20"
export const hoursfor = (date) => {
    const day = new Date(date + "T12:00:00").toLocaleDateString("en-US",{weekday: "long"});
    return cafe.hours.find((h) => h.day === day);
};


// every 30 minutes the shop is open, stopping 1 hour before closing
export const timeslots = (date) => {
    const h = hoursfor(date);
    if (!h) return [];

    const ALslots = [];
    const [oh,om] = h.open.split(":").map(Number);
    const [ch,cm] = h.close.split(":").map(Number);

    for (let m = oh * 60 + om; m <= ch * 60 + cm - 60; m += 30) {
        ALslots.push(String(Math.floor(m / 60)).padStart(2,"0") + ":" + String(m % 60).padStart(2,"0"));
    }
    return ALslots;
};

// returns a label for a time like "14:30" in 12-hour format with AM/PM
export const today = () => {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
};

// returns a label for a time like "14:30" in 12-hour format with AM/PM
export const adddays = (date,days) => {
    const d = new Date(date + "T12:00:00");
    d.setDate(d.getDate() + days);
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
};


export const prettydate = (date) =>
    new Date(date + "T12:00:00").toLocaleDateString("en-CA",{weekday: "short",month: "short",day: "numeric",year: "numeric"});


export const prettytime = (time) => {
    const [h,m] = time.split(":").map(Number);
    return (h % 12 || 12) + ":" + String(m).padStart(2,"0") + (h < 12 ? " AM" : " PM");
};


// the sample JSON uses "days_ago" / "in_days" so the data always looks fresh.
// these turn them into real dates the first time the site opens (same as in the admin)
export const seedorders = (ALorders) => ALorders.map(({days_ago,time,...o}) => {
    if (o.created_at) return o;
    return {...o,created_at: new Date(adddays(today(),-days_ago) + "T" + time + ":00").toISOString()};
});

export const seedreservations = (ALreservations) => ALreservations.map(({in_days,...r}) => {
    if (r.reservation_date) return r;
    return {...r,reservation_date: adddays(today(),in_days)};
});
