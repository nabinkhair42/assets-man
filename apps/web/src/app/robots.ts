import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl =
    process.env.NEXT_PUBLIC_APP_URL || "http://assets-man.nabinkhair.com.np";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/files",
          "/recent",
          "/starred",
          "/trash",
          "/share",
          "/api/",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
