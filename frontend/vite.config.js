import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
        ws: true,
        configure(proxy) {
          proxy.on("proxyReq", (proxyReq, req) => {
            // Replace client-supplied headers; only forward the real connection IP.
            proxyReq.setHeader("X-Forwarded-For", req.socket.remoteAddress);
          });
        },
      },
      "/uploads": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
      },
    },
  },
});
