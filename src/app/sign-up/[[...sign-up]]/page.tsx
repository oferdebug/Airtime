import { SignUp } from '@clerk/nextjs';
import { Mic2 } from 'lucide-react';
import Link from 'next/link';

export default function SignUpPage() {
  return (
    <main className="min-h-screen mesh-background flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl grid gap-5 lg:grid-cols-2 items-center">
        <div className="glass-card rounded-3xl p-8 space-y-5">
          <Link
            href="/"
            aria-label="Go to Airtime homepage"
            className="inline-flex items-center gap-2 rounded-xl bg-white/90 px-3 py-2 shadow-sm"
          >
            <div className="p-2 rounded-xl gradient-brand text-white">
              <Mic2 className="h-4 w-4" />
            </div>
            <span className="text-xl font-bold text-black">Airtime</span>
          </Link>
          <h1 className="text-4xl font-extrabold leading-tight">
            Create your AI podcast production hub
          </h1>
          <p className="text-muted-foreground">
            Start free, upload your first episode, and generate polished content
            in minutes.
          </p>
        </div>

        <div className="glass-card-strong rounded-3xl p-3">
          <SignUp
            path="/sign-up"
            routing="path"
            signInUrl="/sign-in"
            fallbackRedirectUrl="/dashboard/projects"
          />
        </div>
      </div>
    </main>
  );
}
