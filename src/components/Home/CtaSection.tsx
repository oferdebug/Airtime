import { SignInButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Mic2, Upload } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";

export default async function CtaSection() {
  const { userId } = await auth();
  const isSignedIn = !!userId;
  

  return (
    <section className="relative py-24 md:py-32 overflow-hidden gradient-brand">
      {/* Mesh Background */}
      <div className="absolute inset-0 mesh-background-subtle" />

      {/* Decorative Orbs */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-4xl opacity-20 animate-float" />
      <div
        className="absolute -bottom-24 -left-24 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-4xl opacity-20 animate-float"
        style={{ animationDelay: "2s" }}
      />

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          <div className="rounded-4xl p-12 md:p-16">
            <h2 className="text-5xl md:text-6xl font-extrabold mb-6 text-white drop-shadow-lg">
              Ready to Supercharge Your Podcasts?
            </h2>
            <p className="text-xl md:text-2xl text-white mb-10 leading-relaxed drop-shadow-lg">
              {isSignedIn
                ? "Continue your journey and upload your next masterpiece."
                : "Sign up now and unlock the full potential of AI-powered podcasting!"}
            </p>
            {isSignedIn ? (
              <Button
                asChild
                size="lg"
                className="bg-white text-brand-600 hover:bg-white/90 hover-glow text-lg px-10 py-7 rounded-xl shadow-2xl font-bold"
              >
                <Link href="/dashboard/uploads">
                  Go to Dashboard
                  <Upload className="ml-2 h-7 w-7" />
                </Link>
              </Button>
            ) : (
              <SignInButton mode="modal">
                <Button
                  size="lg"
                  className="bg-white text-brand-600 hover:bg-white/90 hover-glow text-lg px-10 py-7 rounded-xl shadow-2xl font-bold"
                >
                  Get Started Today
                  <Mic2 className="ml-2 h-7 w-7" />
                </Button>
              </SignInButton>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
