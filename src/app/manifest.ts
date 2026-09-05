import type { MetadataRoute } from "next";

// PWA manifest — Next samodejno servira na /manifest.webmanifest in doda
// <link rel="manifest">. Ikona je vektorska (public/icon.svg); sodobni
// brskalniki jo sprejmejo kot 192/512 prek sizes: "any".
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pisi — beležke",
    short_name: "Pisi",
    description: "Beležke, sekcije in strani na enem mestu.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    lang: "sl",
    dir: "ltr",
    categories: ["productivity", "utilities"],
    background_color: "#0f172a",
    theme_color: "#0f172a",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "192x192", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
