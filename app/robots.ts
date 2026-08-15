import type { MetadataRoute } from "next";
import { IS_INDEXABLE_SITE, SITE_URL } from "../src/config/Site";

export default function robots(): MetadataRoute.Robots {
  if (!IS_INDEXABLE_SITE) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/api/",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
