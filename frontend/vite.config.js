import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
    plugins: [react()],
    server: {
        open: true, // Automatically open browser
        port: 3000, // Set explicit port
    },
    define: {
        "process.env": {},
        global: "window",
    },
    resolve: {
        alias: {
            "@": "/src",
        },
    },
    json: {
        stringify: true,
    },
    optimizeDeps: {
        esbuildOptions: {
            define: {
                global: "globalThis",
            },
        },
    },
})
