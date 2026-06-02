import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/login", "/register", "/forgot-password"],
      disallow: ["/dashboard/", "/api/", "/reset-password"],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
