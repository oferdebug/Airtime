'use client';

import { useParams } from "next/navigation";




export default function ProjectDetailsPage(){
    const {id} = useParams();
  return (
    <main>
      <h1>Projects Details {id}</h1>
      
    </main>
  );
}