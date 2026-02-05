import { ArrowLeft, Calendar, Clock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import Footer from "@/components/Home/Footer";
import { getBlogPost, getBlogPosts } from "@/lib/blog";
import { formatDate } from "@/lib/format";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const posts = await getBlogPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return { title: "Post not found" };
  return {
    title: `${post.title} | Airtime Blog`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) notFound();

  return (
    <div className="min-h-screen">
      <Header />
      <article className="container mx-auto px-6 py-24">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-brand-600 font-semibold mb-8 hover:gap-3 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Link>

          <div className="flex items-center gap-4 mb-6 text-sm text-slate-600">
            <span className="px-3 py-1 rounded-full bg-brand-100 text-brand-700 font-semibold text-xs">
              {post.category}
            </span>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(new Date(post.date))}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {post.readTime}
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 text-slate-950">
            {post.title}
          </h1>
          <p className="text-xl text-slate-700 leading-relaxed mb-8">
            {post.excerpt}
          </p>

          <div className="prose prose-slate max-w-none">
            {post.body ? (
              /* biome-ignore lint/security/noDangerouslySetInnerHtml: blog body from trusted CMS/mock data */
              <div
                className="post-content"
                dangerouslySetInnerHTML={{ __html: post.body }}
              />
            ) : (
              <p className="text-slate-600">
                Full article content will go here. Connect a CMS or add MDX
                files and render the body in this section.
              </p>
            )}
          </div>
        </div>
      </article>
      <Footer />
    </div>
  );
}
