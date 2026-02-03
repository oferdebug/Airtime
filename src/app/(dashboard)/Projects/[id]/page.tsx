"use client";

import { useQuery } from "convex/react";
import { useParams } from "next/navigation";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";

export default function ProjectDetailsPage() {
    const params = useParams();
    const projectId = params.id as string; 
    const project = useQuery(api.projects.getProjectById, { id: projectId as Id<'projects'> });
    
    return (
        <div className='p-8 min-h-screen'>
            <h1 className={'text-2xl font-bold'}>Project Details</h1>
            <p className={'mt-5 text-lg'}>
                Project ID From URL: <strong>{projectId||'not Found'}</strong>
            </p>
            <p className={'mt-5 text-stone-500'}>
                If you see this, it means the project details are being fetched from the database.
                <pre className={'mt-5 p-4 bg-stone-50 rounded-md text-sm'}>
                    {JSON.stringify(project, null, 2)}
                </pre>
            </p>
        </div>
  );
}
