import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_NAME, THEME_COLOR } from "../src/config/Site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} - 내 주변 길거리 음식`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: THEME_COLOR,
    lang: "ko-KR",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
