import type { MetadataRoute } from 'next';
import { getBlogPosts, getLatestPostDate } from '@/lib/blog';

const LAST_MODIFIED_DATES = {
  home: new Date('2025-01-27'),
} as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (
    process.env.NEXT_PUBLIC_APP_URL || 'https://airtime.com'
  ).replace(/\/+$/, '');
  const posts = await getBlogPosts();
  const blogLastModified = await getLatestPostDate();

  const blogEntries: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/blog`,
      lastModified: blogLastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    ...posts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ];

  return [
    {
      url: baseUrl,
      lastModified: LAST_MODIFIED_DATES.home,
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    ...blogEntries,
  ];
}
