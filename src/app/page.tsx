"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Settings } from "lucide-react";
import { ProjectCard } from "@/components/project-card";
import { AddProjectDialog } from "@/components/add-project-dialog";
import { useProjects } from "@/hooks/use-projects";
import { Skeleton } from "@/components/ui/skeleton";
import "@/components/Beams.css";

// Dynamic import with SSR disabled for Three.js canvas component
const Beams = dynamic(() => import("@/components/Beams"), { ssr: false });

export default function ProjectsPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { projects, isLoading, error, addProject, updateProjectTags } = useProjects();

  const handleAddProject = async (input: { name: string; path: string }) => {
    await addProject(input);
  };

  return (
    <div className="relative min-h-screen">
      {/* Beams Background - fixed, full-screen, z-0 */}
      <div className="fixed inset-0 z-0">
        <Beams
          beamWidth={8}
          beamHeight={14}
          beamNumber={20}
          lightColor="#f0c7ff"
          speed={2}
          noiseIntensity={1.75}
          scale={0.2}
          rotation={30}
        />
      </div>

      {/* Settings Icon - fixed top-right, z-20 */}
      <Link
        href="/settings"
        aria-label="Settings"
        className="fixed right-6 top-6 z-20 rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2"
      >
        <Settings className="h-5 w-5" aria-hidden="true" />
      </Link>

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center px-6 py-16">
        {/* Centered Heading with Space Grotesk */}
        <h1 className="mb-12 text-center text-balance font-heading text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
          Manage Your Beads Projects
        </h1>

        <div className="w-full max-w-[1200px]">
          {isLoading ? (
            <div role="status" aria-label="Loading projects" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl border bg-white/80 p-4 backdrop-blur-sm">
                  <div className="mb-3 flex gap-1.5">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-12" />
                  </div>
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="mt-2 h-4 w-48" />
                  <Skeleton className="mt-4 h-4 w-32" />
                  <Skeleton className="mt-2 h-3 w-28" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50/90 p-6 text-center backdrop-blur-sm">
              <p className="text-red-600">Error loading projects: {error.message}</p>
              <p className="mt-2 text-sm text-red-500">
                Make sure the Tauri backend is running.
              </p>
            </div>
          ) : projects.length === 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border border-dashed border-zinc-300 bg-white/80 p-6 text-center text-zinc-500 backdrop-blur-sm">
                <p>No projects yet</p>
                <p className="mt-1 text-sm">Click the button below to add a project</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  id={project.id}
                  name={project.name}
                  path={project.path}
                  tags={project.tags}
                  onTagsChange={(tags) => updateProjectTags(project.id, tags)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* FAB - Add Project, z-20 */}
      <button
        onClick={() => setIsAddDialogOpen(true)}
        className="fixed bottom-6 right-6 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
        aria-label="Add Project"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M5 12h14" />
          <path d="M12 5v14" />
        </svg>
      </button>

      {/* Add Project Dialog */}
      <AddProjectDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAddProject={handleAddProject}
      />
    </div>
  );
}
