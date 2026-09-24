import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  server: {
    host: true, // expõe na rede local para o celular acessar
    proxy: {
      "/api": {
        target: "http://localhost:3333",
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      // Necessário para o Web Push funcionar (RF03): o service worker precisa
      // implementar o evento "push" para exibir a notificação recebida.
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      manifest: {
        name: "VanApp",
        short_name: "VanApp",
        description: "Presença e avisos da van universitária, sem depender de grupo de WhatsApp.",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#1d4ed8",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
    }),
  ],
});
