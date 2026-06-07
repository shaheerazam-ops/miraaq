import type { MetadataRoute } from "next";
import { appConfig } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/dashboard/", "/api/", "/checkout/"],
    },
    sitemap: `${appConfig.url}/sitemap.xml`,
  };
}
