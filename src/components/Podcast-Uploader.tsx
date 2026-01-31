"use client";

import { useAuth } from "@clerk/nextjs";
import { upload } from "@vercel/blob/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import {
  createProjectAction,
  validateProjectAction,
  deleteProjectAction,
  updateProjectAction,
  getProjectAction,
  getProjectsAction,
  getProjectByIdAction,
  getProjectBySlugAction,
  getProjectByUserIdAction,
  getProjectByUserIdAndSlugAction,
} from "@/app/actions/projects";
import { Button } from "./ui/button";
import { UploadDropzone } from "@/components/UploadDropzone";
import { UploadProgress } from "@/components/UploadProgress";
import {
  estimateDurationFromSize,
  getAudioDurationInSeconds,
} from "@/lib/audio-utils";
import type { UploadStatus } from "@/lib/types";

export default function PodcastUploader() {
  // TODO: Implement component UI

  return null;
}
