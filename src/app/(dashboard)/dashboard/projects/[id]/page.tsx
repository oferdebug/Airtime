import {
  deleteProjectAction,
  updateDisplayNameAction,
} from "@/app/actions/projects";
import { Card, CardContent } from "@/components/ui/card";
import type { PhaseStatus } from "@/lib/types";
import { useAuth } from "@clerk/nextjs";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function ProjectDetailsPage() {
  const { userId } = useAuth();
  const router = useRouter();
  const { id } = useParams();

  const projectId = id as Id<"projects">;

  //Convex Query
  const project = useQuery(api.projects.getProject, { projectId });

  //State Managment

  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  //Tab State For Mobile
  const [activeTab, setActiveTab] = useState("summary");

  //Status From Convex
  const transcriptionStatus: PhaseStatus =
    project?.jobStatus?.transcription || "pending";
  const generationStatus: PhaseStatus =
    project?.jobStatus?.contentGeneration || "pending";

  //Handlers Editeded Titles
  const handleStartEdit = () => {
    setEditedName(project?.displayName || project?.fileName || "");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedName("");
  };

  const handleEditSave = () => {
    setIsSaving(true);
    setEditedName("");
    setIsEditing(false);
    setIsSaving(false);
  };

  const handleSaveEdit = async () => {
    if (!editedName.trim()) {
      toast.error("Project Name Could Not Be Empty");
      return;
    }

    setIsSaving(true);
    try {
      await updateDisplayNameAction(projectId, editedName);
      toast.success("Project Name Updated Successfully");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed To Update Project Name",
      );
    } finally {
      setIsSaving(false);
    }
  };

  //Handlers Delete Project
  const handleDelete = async () => {
    const confirmd = window.confirm(
      "Are You Sure You Want To Delete This Project? This Action Cannot Be Reversed",
    );
    if (!confirmd) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteProjectAction(projectId);
      toast.success("Project Deleted Succsufully");
      router.push("/dashboard/projects");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed To Delete Project, Please Try Again",
      );
      setIsDeleting(false);
    }
  };

  if (!project) {
    return (
      <div className={"container max-w-8xl mx-auto py-12 px-4"}>
        <div className={"flex items-center justify-center min-h-[450px]"}>
          <Loader2 className={"h-8 w-8 animate-spin text-primary"} />
        </div>
      </div>
    );
  }

  if (project.userId !== userId) {
    return (
      <div className={"container max-w-6xl mx-auto py-10 px-4"}>
        <Card>
          <CardContent className={"pt-4"}>
            <p className={"text-center text-muted-foreground"}>
              You Don't Have Accsess To This Project
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isProcessing = project.status === "processing";
  const isCompleted = project.status === "completed";
  const hasFailed = project.status === "failed";
  const showGenerating = isProcessing && generationStatus === "running";
  const showTranscribing = isProcessing && transcriptionStatus === "running";

  return (
    <div className={"container max-w-8xl mx-auto py-12 py-4"}>
      {/* Header With Title */}
      <div className={"mb-6 flex items-start justify-between"}>
        <div className={"flex-1 min-w-0"}></div>
      </div>
      <h1>ProjectDetailsPage {id}</h1>
      <p>{project?.displayName}</p>
    </div>
  );
}