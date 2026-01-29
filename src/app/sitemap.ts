import type { MetadataRoute } from "next";
import { getBlogPosts } from "@/lib/blog";

// Stable dates for sitemap entries - update these when pages actually change
const LAST_MODIFIED_DATES = {
  home: new Date("2025-01-27"),
  features: new Date("2025-01-27"),
  pricing: new Date("2025-01-27"),
  about: new Date("2025-01-27"),
  contact: new Date("2025-01-27"),
  privacy: new Date("2025-01-27"),
  terms: new Date("2025-01-27"),
} as const;

// Helper to get the most recent blog post date
async function getLatestPostDate(): Promise<Date> {
  const posts = await getBlogPosts();
  if (posts.length === 0) {
    return new Date("2025-01-27"); // Fallback to default date
  }
  const dates = posts.map((post) => new Date(post.date));
  return new Date(Math.max(...dates.map((date) => date.getTime())));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://airtime.com";
  const blogLastModified = await getLatestPostDate();

  return [
    {
      url: baseUrl,
      lastModified: LAST_MODIFIED_DATES.home,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/features`,
      lastModified: LAST_MODIFIED_DATES.features,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: LAST_MODIFIED_DATES.pricing,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: blogLastModified,
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: LAST_MODIFIED_DATES.about,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: LAST_MODIFIED_DATES.contact,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: LAST_MODIFIED_DATES.privacy,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: LAST_MODIFIED_DATES.terms,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
