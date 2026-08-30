import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const googleKey = env.VITE_GOOGLE_PLACES_API_KEY;
  const foursquareKey = env.VITE_FOURSQUARE_API_KEY;
  const geoapifyKey = env.VITE_GEOAPIFY_API_KEY;

  const proxy = {};

  if (googleKey) {
    proxy["/api/google-places"] = {
      target: "https://maps.googleapis.com",
      changeOrigin: true,
      rewrite: (path) =>
        path.replace(/^\/api\/google-places/, "/maps/api/place"),
      configure: (proxyServer) => {
        proxyServer.on("proxyReq", (proxyReq) => {
          const path = proxyReq.path || "";
          const sep = path.includes("?") ? "&" : "?";
          proxyReq.path = `${path}${sep}key=${encodeURIComponent(googleKey)}`;
        });
      },
    };
  }

  if (foursquareKey) {
    proxy["/api/foursquare"] = {
      target: "https://api.foursquare.com",
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api\/foursquare/, "/v3"),
      configure: (proxyServer) => {
        proxyServer.on("proxyReq", (proxyReq) => {
          proxyReq.setHeader("Authorization", foursquareKey);
          proxyReq.setHeader("Accept", "application/json");
        });
      },
    };
  }

  if (geoapifyKey) {
    proxy["/api/geoapify"] = {
      target: "https://api.geoapify.com",
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api\/geoapify/, ""),
      configure: (proxyServer) => {
        proxyServer.on("proxyReq", (proxyReq) => {
          const path = proxyReq.path || "";
          const sep = path.includes("?") ? "&" : "?";
          proxyReq.path = `${path}${sep}apiKey=${encodeURIComponent(geoapifyKey)}`;
        });
      },
    };
  }

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: Object.keys(proxy).length ? proxy : undefined,
    },
  };
});
