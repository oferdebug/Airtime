import PodcastUploader from "@/components/Podcast-Uploader";

export default function UploadsPage() {
  return (
    <div className="p-8 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Upload Podcast</h1>
      <PodcastUploader />
    </div>
  );
}
