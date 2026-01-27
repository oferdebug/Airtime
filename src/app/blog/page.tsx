import Link from "next/link";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Learn about podcasting, AI transcription, content creation, and more. Tips, tutorials, and insights from the Airtime team.",
};

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  category: string;
}

const blogPosts: BlogPost[] = [
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

export default function BlogPage() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-6 py-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-extrabold mb-4 text-slate-950">
              Blog & <span className="gradient-brand-text">Resources</span>
            </h1>
            <p className="text-xl text-slate-700 max-w-2xl mx-auto">
              Tips, tutorials, and insights to help you create better podcast
              content.
            </p>
          </div>

          <div className="space-y-8">
            {blogPosts.map((post) => (
              <article
                key={post.slug}
                className="glass-card rounded-2xl p-8 hover-lift group"
              >
                <div className="flex items-center gap-4 mb-4 text-sm text-slate-600">
                  <span className="px-3 py-1 rounded-full bg-brand-100 text-brand-700 font-semibold text-xs">
                    {post.category}
                  </span>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(post.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {post.readTime}
                  </div>
                </div>
                <h2 className="text-2xl font-extrabold mb-3 text-slate-950 group-hover:text-brand-600 transition-colors">
                  {post.title}
                </h2>
                <p className="text-slate-700 mb-6 leading-relaxed">
                  {post.excerpt}
                </p>
                <Link
                  href={`/blog/${post.slug}`}
                  className="inline-flex items-center gap-2 text-brand-600 font-semibold hover:gap-3 transition-all"
                >
                  Read more
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
