import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      // Without this, the manifest + service worker are only injected into
      // a production build — `npm run dev` serves plain index.html with no
      // manifest link and no SW, so the browser never considers the app
      // "installable" and `beforeinstallprompt` never fires. This makes
      // installability (and therefore the Install button) work in dev too.
      devOptions: {
        enabled: true,
        type: "module",
      },
      manifest: {
        name: "ScoreKing",
        short_name: "ScoreKing",
        description: "Live multiplayer card game scoreboard",
        theme_color: "#0d0d1a",
        background_color: "#0d0d1a",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
        ]
      }
    })
  ]
});
