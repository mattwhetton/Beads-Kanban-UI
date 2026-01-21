"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ProjectCard } from "@/components/project-card";
import { AddProjectDialog } from "@/components/add-project-dialog";
import { useProjects } from "@/hooks/use-projects";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectsPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { projects, isLoading, error, addProject, updateProjectTags } = useProjects();

  const handleAddProject = async (input: { name: string; path: string }) => {
    await addProject(input);
  };

  return (
    <div className="dark min-h-dvh bg-[#0a0a0a]">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-30 border-b border-zinc-800 bg-[#0a0a0a]/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-4">
          {/* Logo on left */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.svg"
              alt="BeadsUI"
              width={140}
              height={40}
              className="h-10 w-auto"
              priority
            />
          </Link>

          {/* Navigation links on right */}
          <div className="flex items-center gap-4">
            <Link
              href="/settings"
              className="rounded-md px-3 py-2 text-sm font-medium text-zinc-400 transition-[background-color,color] duration-150 hover:bg-zinc-800/50 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]"
            >
              Settings
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - pushed down with padding */}
      <main className="flex flex-col items-center px-6 pt-32">
        {/* Centered Heading with Space Grotesk */}
        <h1 className="mb-12 text-center text-balance font-heading text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Manage Your Beads Projects
        </h1>

        <div className="w-full max-w-[1200px]">
          {isLoading ? (
            <div role="status" aria-label="Loading projects" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
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
            <div role="alert" className="rounded-lg border border-red-800/50 bg-red-950/70 p-6 text-center">
              <p className="text-red-400">Error loading projects: {error.message}</p>
              <p className="mt-2 text-sm text-red-500">
                Make sure the Tauri backend is running.
              </p>
            </div>
          ) : projects.length === 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border border-dashed border-zinc-700 bg-zinc-900/70 p-6 text-center text-zinc-400">
                <p>No projects yet</p>
                <p className="mt-1 text-sm text-zinc-500">Click the button below to add a project</p>
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
                  beadCounts={project.beadCounts}
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
        className="fixed bottom-6 right-6 z-20 flex size-14 items-center justify-center rounded-full bg-zinc-100 text-zinc-900 shadow-lg hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-100 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]"
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
