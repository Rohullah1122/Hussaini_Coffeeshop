export const money = (n) => "$" + Number(n).toFixed(2);


export const dateonly = (d) =>
    d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");

export const today = () => dateonly(new Date());

export const adddays = (date,days) => {
    const d = new Date(date + "T12:00:00");
    d.setDate(d.getDate() + days);
    return dateonly(d);
};


export const prettydate = (date) =>
    new Date(date + "T12:00:00").toLocaleDateString("en-CA",{weekday: "short",month: "short",day: "numeric"});

export const prettytime = (time) => {
    const [h,m] = time.split(":").map(Number);
    return (h % 12 || 12) + ":" + String(m).padStart(2,"0") + (h < 12 ? " AM" : " PM");
};

export const prettydatetime = (iso) =>
    new Date(iso).toLocaleString("en-CA",{month: "short",day: "numeric",hour: "numeric",minute: "2-digit"});


// the sample JSON uses "days_ago" / "in_days" so the dashboard always has fresh data.
// these turn them into real dates the first time the admin opens
export const seedorders = (ALorders) => ALorders.map(({days_ago,time,...o}) => {
    if (o.created_at) return o;
    return {...o,created_at: new Date(adddays(today(),-days_ago) + "T" + time + ":00").toISOString()};
});

export const seedreservations = (ALreservations) => ALreservations.map(({in_days,...r}) => {
    if (r.reservation_date) return r;
    return {...r,reservation_date: adddays(today(),in_days)};
});

export const seedreviews = (ALreviews) => ALreviews.map(({days_ago,...r}) => {
    if (r.created_at) return r;
    return {...r,created_at: new Date(adddays(today(),-days_ago) + "T12:00:00").toISOString()};
});


export const ORDERSTATUS = ["pending","preparing","ready","delivered","cancelled"];
export const BOOKINGSTATUS = ["pending","confirmed","completed","cancelled"];
