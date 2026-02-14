'use client';

import { useParams } from "next/navigation";




export default function ProjectDetailsPage(){
    const params = useParams();
    const id = typeof params.id === 'string' ? params.id : params.id?.[0];
    
    if (!id) {
      return <main><h1>Project not found</h1></main>;
    }
    
  return (
    <main>
      <h1>Project Details {id}</h1>
      
    </main>
  );
}