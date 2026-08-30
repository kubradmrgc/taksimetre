import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const googleKey = env.VITE_GOOGLE_PLACES_API_KEY;

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: googleKey
        ? {
            "/api/google-places": {
              target: "https://maps.googleapis.com",
              changeOrigin: true,
              rewrite: (path) =>
                path.replace(/^\/api\/google-places/, "/maps/api/place"),
              configure: (proxy) => {
                proxy.on("proxyReq", (proxyReq) => {
                  const path = proxyReq.path || "";
                  const sep = path.includes("?") ? "&" : "?";
                  proxyReq.path = `${path}${sep}key=${encodeURIComponent(googleKey)}`;
                });
              },
            },
          }
        : undefined,
    },
  };
});
