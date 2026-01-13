"use client";

import { useState } from "react";
import Link from "next/link";
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
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-zinc-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-zinc-900">Beads</h1>
          <Link
            href="/settings"
            className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border p-4">
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
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-red-600">Error loading projects: {error.message}</p>
            <p className="mt-2 text-sm text-red-500">
              Make sure the Tauri backend is running.
            </p>
          </div>
        ) : projects.length === 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-zinc-500">
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
                lastOpened={project.lastOpened}
                onTagsChange={(tags) => updateProjectTags(project.id, tags)}
              />
            ))}
          </div>
        )}
      </main>

      {/* FAB - Add Project */}
      <button
        onClick={() => setIsAddDialogOpen(true)}
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg hover:bg-zinc-800"
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
