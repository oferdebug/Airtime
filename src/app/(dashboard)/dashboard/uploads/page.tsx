import type { Metadata } from "next";
import PodcastUploader from "@/components/Podcast-Uploader";

export const metadata: Metadata = {
  title: "Upload Podcast",
  description:
    "Upload your podcast audio file to get AI-powered transcription, summaries, social posts, and key moments.",
  openGraph: {
    title: "Upload Podcast | Airtime",
    description:
      "Upload your podcast audio file to get AI-powered transcription, summaries, social posts, and key moments.",
  },
  robots: { index: true, follow: true },
};

export default function UploadsPage() {
  return (
    <div className="p-8 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Upload Podcast</h1>
      <PodcastUploader />
    </div>
  );
}
