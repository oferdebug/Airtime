// Blog data fetching utility
// This can be replaced with a CMS or MDX file loader later

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  category: string;
}

// In a real app, this would fetch from a CMS or read MDX files
// For now, we'll use a function that can be easily replaced
export async function getBlogPosts(): Promise<BlogPost[]> {
  // TODO: Replace with actual CMS/DB fetch or MDX file reading
  // Example: return await fetchPostsFromCMS() or await readMDXFiles()
  
  return [
    {
      slug: "getting-started-with-podcast-transcription",
      title: "Getting Started with AI Podcast Transcription",
      excerpt:
        "Learn how to leverage AI-powered transcription to make your podcast content more accessible and searchable.",
      date: "2025-01-20",
      readTime: "5 min read",
      category: "Tutorial",
    },
    {
      slug: "improve-podcast-seo",
      title: "5 Ways to Improve Your Podcast SEO",
      excerpt:
        "Discover proven strategies to boost your podcast's discoverability and reach a wider audience through SEO best practices.",
      date: "2025-01-15",
      readTime: "7 min read",
      category: "Marketing",
    },
    {
      slug: "ai-content-creation-tips",
      title: "AI Content Creation: Tips for Podcasters",
      excerpt:
        "Explore how AI can help you create engaging social media posts, summaries, and key moments from your podcast episodes.",
      date: "2025-01-10",
      readTime: "6 min read",
      category: "Tips",
    },
  ];
}

// Helper to get a single blog post by slug
// TODO: Replace getBlogPost and getBlogPosts with direct database/CMS queries
// When migrating to a real data source, implement getPostBySlug(slug) that performs
// an O(1)/indexed lookup instead of fetching all posts and scanning the list.
// This will improve performance as the blog grows.
export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  const posts = await getBlogPosts();
  return posts.find((post) => post.slug === slug) || null;
}
