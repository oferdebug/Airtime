import { SignInButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Mic2 } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";

export async function HeroSection() {
  const { userId } = await auth();
  const isSingedIn = !!userId;
  return (
    <section
      className={"relative overflow-hidden mesh-background min-h-screen"}
    >
      <div className={"container mx-auto px-5 py-26 md:pb-26 lgmd:pt-25"}>
        <div className={"max-w-5xl mx-auto"}>
          <div className={"text-center mb-20 animate-float"}>
            <div
              className={
                "inline-flex items-center gap-3 px-5 py-2.5 rounded-full glass-card hover-glow mb-8 animate-shimmer"
              }
            >
              <span
                className={
                  "text-sm font-semibold bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent"
                }
              >
                AI-Powered Podcast Transcription & Search
              </span>
            </div>

            <h1
              className={
                "text-6xl md:text-7xl lg:text-8xl font-extrabold text-white leading-tight"
              }
            >
              <span className={"gradient-emerald-text"}>Transform</span> Your
              <br />
              Podcasts Into AI Content Machine
            </h1>

            <p
              className={
                "text-xl md:text-2xl text-gray-800 mb-12 max-w-3xl mx-auto leading-relaxed"
              }
            >
              Upload your audio and get AI - generated transcripts, summaries,
              social posts, and key moments - all in minutes.
            </p>
          </div>

          {isSingedIn ? (
            <div className={"space-y-6"}>
              <div className={"glass-card-strong rounded-2xl p-9 hover-lift"}>
                {/*<PodcastUploader />*/}
              </div>
              <div className={"text-center"}>
                <Link href={"/dashboard/projects"}>
                  <Button
                    variant={"outline"}
                    size={"lg"}
                    className={"hover-glow"}
                  >
                    View Projects
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div
              className={
                "flex flex-col sm:flex-row items-center justify-center gap-6"
              }
            >
              <SignInButton mode={"modal"}>
                <Button
                  size={"lg"}
                  className={
                    "gradient-emerald text-white hover-glow text-lg px-9 py-8 rounded-xl shadow-lg"
                  }
                >
                  Get Started Today
                  <Mic2 className={"ml-2 h-7 w-7"} />
                </Button>
              </SignInButton>
              <Link href={"/dashboard/projects"}>
                <Button
                  variant={"outline"}
                  size={"lg"}
                  className={
                    "hover-glow text-xl px-9 py-7 rounded-xl shadow-lg"
                  }
                >
                  View Your Projects
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Gradient Orbs */}
      <div
        className={
          "absolute top-0 right-0 w-96 h-96 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"
        }
      ></div>
      <div
        className="absolute bottom-0 left-0 w-96 h-96 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"
        style={{ animationDelay: "1s" }}
      />
    </section>
  );
}
