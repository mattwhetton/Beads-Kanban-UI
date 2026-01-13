"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getProjectsWithTags,
  createProject,
  type CreateProjectInput,
} from "@/lib/db";
import type { Project, Tag } from "@/types";

interface UseProjectsResult {
  projects: Project[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  addProject: (input: CreateProjectInput) => Promise<Project>;
  updateProjectTags: (projectId: string, tags: Tag[]) => void;
}

export function useProjects(): UseProjectsResult {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getProjectsWithTags();
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch projects"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addProject = useCallback(
    async (input: CreateProjectInput): Promise<Project> => {
      const newProject = await createProject(input);
      await fetchProjects();
      return newProject;
    },
    [fetchProjects]
  );

  const updateProjectTags = useCallback((projectId: string, tags: Tag[]) => {
    setProjects((prev) =>
      prev.map((project) =>
        project.id === projectId ? { ...project, tags } : project
      )
    );
  }, []);

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    projects,
    isLoading,
    error,
    refetch: fetchProjects,
    addProject,
    updateProjectTags,
  };
}
