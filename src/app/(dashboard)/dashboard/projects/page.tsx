import { auth } from "@clerk/nextjs/server";
import { ProjectsList } from "@/components/ProjectsList";

export default async function ProjectsPage() {
  const authObj = await auth();
  const { userId } = authObj;
  if (!userId) {
    return (
      <div className="p-8 min-h-screen">
        <h1 className="text-2xl font-bold">My Projects</h1>
        <p className="mt-5 text-stone-500">
          Please sign in to view your projects.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 min-h-screen">
      <h1 className="text-2xl font-bold">My Projects</h1>
      <ProjectsList userId={userId} />
    </div>
  );
}
