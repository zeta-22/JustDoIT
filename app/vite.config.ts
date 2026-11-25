import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: false, // la registrazione è in src/lib/update.ts (controlla gli aggiornamenti anche al ritorno in primo piano)
      manifest: {
        name: "JustDoIT", short_name: "JustDoIT", lang: "it",
        description: "Piano palestra: gara BJJ, poi Ironman",
        theme_color: "#10131a", background_color: "#f2f4f7", display: "standalone", start_url: "/",
        // icona: la punta di una cintura blu (barra nera, tre gradi e il quarto tratteggiato), a tutto campo: va bene anche come maskable
        icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }, { src: "/icon-512.png", sizes: "512x512", type: "image/png" }, { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }, { src: "/favicon.svg", sizes: "any", type: "image/svg+xml" }],
        // pressione lunga sull'icona su Android: si aprono direttamente (gestite in App.tsx con ?go=)
        shortcuts: [
          { name: "Pesata e check-in", short_name: "Check-in", url: "/?go=checkin", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
          { name: "Registra il tatami", short_name: "Tatami", url: "/?go=tatami", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
          { name: "Progressi", short_name: "Progressi", url: "/?go=progressi", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
          { name: "Esercizi", short_name: "Esercizi", url: "/?go=esercizi", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
        ],
      },
      // la versione nuova prende subito il controllo; la pagina si ricarica da sola quando può (src/lib/update.ts)
      workbox: { globPatterns: ["**/*.{js,css,html,png,svg}"], skipWaiting: true, clientsClaim: true },
    }),
  ],
});
