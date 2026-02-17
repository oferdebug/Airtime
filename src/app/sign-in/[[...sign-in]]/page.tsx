import { SignIn } from "@clerk/nextjs";
import { Mic2 } from "lucide-react";
import Link from "next/link";

export default function SignInPage() {
  return (
    <main className="min-h-screen mesh-background flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl grid gap-5 lg:grid-cols-2 items-center">
        <div className="glass-card rounded-3xl p-8 space-y-5">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="p-2 rounded-xl gradient-brand text-white">
              <Mic2 className="h-4 w-4" />
            </div>
            <span className="text-xl font-bold">Airtime</span>
          </Link>
          <h1 className="text-4xl font-extrabold leading-tight">
            Welcome back to your podcast workspace
          </h1>
          <p className="text-muted-foreground">
            Sign in to continue creating summaries, social posts, and episode
            insights.
          </p>
        </div>

        <div className="glass-card-strong rounded-3xl p-3">
          <SignIn
            path="/sign-in"
            routing="path"
            signUpUrl="/sign-up"
            fallbackRedirectUrl="/dashboard/projects"
          />
        </div>
      </div>
    </main>
  );
}

