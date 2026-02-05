"use client";

import { FolderOpen, Upload } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
export default function DashboardNav() {
  const pathname = usePathname();
  const isActive = (path: string) => {
    if (path === "/dashboard/projects") {
      return pathname === path || pathname.startsWith("/dashboard/projects/");
    }
    return pathname === path;
  };
  return (
    <nav className={"flex items-center gap-4"}>
      <Link href="/dashboard/projects">
        <Button
          variant={"ghost"}
          size={"sm"}
          className={cn(
            "gap-4 transition-all duration-300 font-medium",
            isActive("/dashboard/projects")
              ? "bg-brand-50/10 text-white hover:bg-brand-50/20 hover:scale-105 shadow-lg border border-brand-50/20"
              : "text-white/80 hover:bg-brand-50/10 hover:scale-105",
          )}
        >
          <FolderOpen className={"h-4 w-4"} />
          <span className={"hidden lg:inline"}>My Projects</span>
        </Button>
      </Link>
      <Link href={"/dashboard/uploads"}>
        <Button
          variant={"ghost"}
          size={"sm"}
          className={cn(
            "gap-4 transition-all duration-300 font-medium",
            isActive("/dashboard/uploads")
              ? "bg-brand-50/10 text-white hover:bg-brand-50/20 hover:scale-105 shadow-lg border border-brand-50/20"
              : "text-white/80 hover:bg-brand-50/10 hover:scale-105",
          )}
        >
          <Upload className={"h-4 w-4"} />
          <span className={"hidden lg:inline"}>Upload</span>
        </Button>
      </Link>
    </nav>
  );
}
