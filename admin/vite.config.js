import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";


// admin runs on port 5174, but you open it through the customer site at localhost:5173/admin
// (see client/vite.config.js), so both apps share the same browser storage
export default defineConfig({
    plugins: [react()],
    base: "/admin/",
    server: {
        port: 5174,
        hmr: {clientPort: 5174}
    }
});
