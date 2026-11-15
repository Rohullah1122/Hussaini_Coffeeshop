import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";


// customer website runs on port 5173.
// localhost:5173/admin is sent to the admin app (port 5174), so both apps are on the same
// address and share the same browser storage (orders, bookings, menu, customers)
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            "/admin": {
                target: "http://localhost:5174",
                changeOrigin: true,
                rewrite: (path) => (path === "/admin" ? "/admin/" : path)
            }
        }
    }
});
