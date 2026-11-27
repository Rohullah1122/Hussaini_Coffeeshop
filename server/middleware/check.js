// small helpers used by the routes to validate input


export const isemail = (text) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(text || "").trim());

export const isdate = (text) => /^\d{4}-\d{2}-\d{2}$/.test(String(text || ""));

export const istime = (text) => /^\d{2}:\d{2}(:\d{2})?$/.test(String(text || ""));

export const isprice = (value) => Number.isFinite(Number(value)) && Number(value) >= 0 && value !== "" && value !== null;

export const iswhole = (value,min = 1) => Number.isInteger(Number(value)) && Number(value) >= min;

export const filled = (text,min = 1) => String(text || "").trim().length >= min;


// turns a list of {field: "message"} into one 400 answer, or returns false when everything is fine
export const sendproblems = (res,errors) => {
    if (!Object.keys(errors).length) return false;
    res.status(400).json({error: Object.values(errors)[0],errors});
    return true;
};
