import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ProjectsList } from "@/components/ProjectsList";

export default async function ProjectsPage() {
  const authObj = await auth();
  const { userId } = authObj;
  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="p-8 min-h-screen">
      <h1 className="text-2xl font-bold">My Projects</h1>
      <ProjectsList userId={userId} />
    </div>
  );
}
