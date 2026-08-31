import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

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
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: [
          "favicon.svg",
          "robots.txt",
          "icons/pwa-192.png",
          "icons/pwa-512.png",
        ],
        manifest: {
          name: "Taksimetre",
          short_name: "Taksimetre",
          description:
            "81 il taksi tarifesiyle mesafe, bekleme ve geçişlere göre ücret hesaplayın.",
          theme_color: "#14151a",
          background_color: "#f6f3ec",
          display: "standalone",
          orientation: "portrait-primary",
          lang: "tr",
          start_url: "/",
          scope: "/",
          categories: ["travel", "utilities"],
          icons: [
            {
              src: "/icons/pwa-192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "/icons/pwa-512.png",
              sizes: "512x512",
              type: "image/png",
            },
            {
              src: "/icons/pwa-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          // Durak JSON'ları (~4MB) precache'e alınmaz; runtimeCaching ile ihtiyaçta önbelleğe alınır.
          globPatterns: ["**/*.{js,css,html,svg,png,ico,txt,xml}"],
          navigateFallback: "/index.html",
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "google-fonts-stylesheets",
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "google-fonts-webfonts",
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
              },
            },
            {
              urlPattern: /\/data\/stands\/.*\.json$/i,
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "taxi-stands",
                expiration: {
                  maxEntries: 90,
                  maxAgeSeconds: 60 * 60 * 24 * 14,
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    server: {
      proxy: Object.keys(proxy).length ? proxy : undefined,
    },
  };
});
