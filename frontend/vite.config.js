import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
    plugins: [react()],
    server: {
        open: true, // Automatically open browser
        port: 3000, // Set explicit port
    },
    resolve: {
        alias: {
            "@": "/src",
        },
    },
    json: {
        stringify: true,
    },
})
