import jwt from "jsonwebtoken";
import "dotenv/config";


// makes the login token (the "session"). it lasts 7 days so users don't log in again every time
export const maketoken = (user) => jwt.sign(
    {id: user.id,role: user.role,full_name: user.full_name},
    process.env.JWT_SECRET,
    {expiresIn: "7d"}
);


// reads "Authorization: Bearer <token>" and returns the user inside it, or null
const readtoken = (req) => {
    const header = req.headers.authorization || "";
    if (!header.startsWith("Bearer ")) return null;
    try {
        return jwt.verify(header.slice(7),process.env.JWT_SECRET);
    } catch {
        return null;
    }
};


// must be logged in (any role)
export const needlogin = (req,res,next) => {
    const user = readtoken(req);
    if (!user) return res.status(401).json({error: "Please log in first."});
    req.user = user;
    next();
};


// must be logged in as an admin
export const needadmin = (req,res,next) => {
    const user = readtoken(req);
    if (!user) return res.status(401).json({error: "Please log in first."});
    if (user.role !== "admin") return res.status(403).json({error: "Admins only."});
    req.user = user;
    next();
};


// login is optional (guests can order and book): sets req.user if there is a token
export const maybelogin = (req,res,next) => {
    req.user = readtoken(req);
    next();
};
