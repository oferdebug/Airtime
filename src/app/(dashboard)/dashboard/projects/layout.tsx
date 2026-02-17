import type { ReactNode } from "react";

export default function ProjectsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <main className="pt-6 xl:pt-12">{children}</main>
    </div>
  );
}
  

