/**
 * Blog data layer. Replace with CMS or MDX later.
 * Used by: app/blog/page.tsx, app/blog/[slug]/page.tsx, app/sitemap.ts
 */
export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  /** ISO date string (YYYY-MM-DD) */
  date: string;
  readTime: string;
  category: string;
  /** HTML/MDX body content. Optional until CMS integration. */
  body?: string;
}

const MOCK_POSTS: BlogPost[] = [
  {
    slug: "getting-started-with-podcast-transcription",
    title: "Getting Started with AI Podcast Transcription",
    excerpt:
      "Learn how to leverage AI-powered transcription to make your podcast content more accessible and searchable.",
    date: "2025-01-20",
    readTime: "5 min read",
    category: "Tutorial",
    body: "<p>AI-powered transcription transforms your podcast episodes into searchable, accessible content. In this guide, we walk you through setting up your first transcription and best practices for accuracy.</p><p>Start by uploading your audio file and let our AI handle the rest.</p>",
  },
  {
    slug: "improve-podcast-seo",
    title: "5 Ways to Improve Your Podcast SEO",
    excerpt:
      "Discover proven strategies to boost your podcast's discoverability and reach a wider audience through SEO best practices.",
    date: "2025-01-15",
    readTime: "7 min read",
    category: "Marketing",
    body: "<p>SEO for podcasts is different from traditional web SEO. Focus on show notes, transcripts, and metadata to improve discoverability.</p>",
  },
  {
    slug: "ai-content-creation-tips",
    title: "AI Content Creation: Tips for Podcasters",
    excerpt:
      "Explore how AI can help you create engaging social media posts, summaries, and key moments from your podcast episodes.",
    date: "2025-01-10",
    readTime: "6 min read",
    category: "Tips",
    body: "<p>Use AI to repurpose your podcast content into social posts, newsletters, and blog articles.</p>",
  },
];

/** All posts. Replace with CMS/DB fetch or MDX when ready. */
export async function getBlogPosts(): Promise<BlogPost[]> {
  return [...MOCK_POSTS];
}

/** Single post by slug. TODO: O(1) lookup when moving to DB/CMS. */
export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  const posts = await getBlogPosts();
  return posts.find((p) => p.slug === slug) ?? null;
}

/** Latest post date for sitemap lastModified. */
export async function getLatestPostDate(): Promise<Date> {
  const posts = await getBlogPosts();
  if (posts.length === 0) return new Date();
  const sorted = [...posts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  const d = new Date(sorted[0].date);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}
