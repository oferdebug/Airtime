import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  // Remove trailing slash from base URL to avoid double slashes
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://airtime.com").replace(/\/+$/, '');

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Include both with and without trailing slashes for better coverage
        disallow: ["/dashboard", "/dashboard/", "/api", "/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
