import type { MetadataRoute } from "next";
import { getBlogPosts } from "@/lib/blog";

// Stable dates for sitemap entries - update these when pages actually change
const LAST_MODIFIED_DATES = {
  home: new Date("2025-01-27"),
  blog: new Date() // Will be updated by getLatestPostDate
} as const;

// Helper to get the most recent blog post date
async function getLatestPostDate(): Promise<Date> {
  try {
    const posts = await getBlogPosts();
    if (posts.length === 0) {
      return new Date("2025-01-27"); // Fallback to default date
    }
    
    // Sort posts by date descending and take the most recent one
    const latestPost = [...posts].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
    
    const latestDate = new Date(latestPost.date);
    return isNaN(latestDate.getTime()) ? new Date("2025-01-27") : latestDate;
  } catch (error) {
    console.error('Error fetching latest post date:', error);
    return new Date("2025-01-27");
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://airtime.com').replace(/\/+$/, '');
  const blogLastModified = await getLatestPostDate();

  return [
    // Home page
    {
      url: baseUrl,
      lastModified: LAST_MODIFIED_DATES.home,
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    // Blog index
    {
      url: `${baseUrl}/blog`,
      lastModified: blogLastModified,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    },
    // Add other valid routes here when they exist
  ];
}
