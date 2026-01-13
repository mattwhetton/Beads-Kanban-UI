/**
 * Frontend API layer for beads-kanban-ui webapp
 * Replaces Tauri invoke() calls with HTTP fetch to backend
 */

import type { Project, Tag, Bead } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3008';

/**
 * Input for creating a new project
 */
export interface CreateProjectInput {
  name: string;
  path: string;
}

/**
 * Input for creating a new tag
 */
export interface CreateTagInput {
  name: string;
  color: string;
}

/**
 * File system entry from directory listing
 */
export interface FsEntry {
  name: string;
  path: string;
  isDirectory: boolean;
}

/**
 * Git branch status information
 */
export interface BranchStatus {
  exists: boolean;
  ahead: number;
  behind: number;
}

/**
 * BD CLI command result
 */
export interface BdCommandResult {
  stdout: string;
  stderr: string;
  code: number;
}

/**
 * File watcher event
 */
export interface WatchEvent {
  path: string;
  type: string;
}

/**
 * Helper for fetch with error handling
 */
async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/**
 * Projects API
 */
export const projects = {
  list: () => fetchApi<Project[]>('/api/projects'),

  create: (data: CreateProjectInput) => fetchApi<Project>('/api/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  update: (id: string, data: Partial<Project>) => fetchApi<Project>(`/api/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),

  delete: (id: string) => fetchApi<void>(`/api/projects/${id}`, { method: 'DELETE' }),
};

/**
 * Tags API
 */
export const tags = {
  list: () => fetchApi<Tag[]>('/api/tags'),

  create: (data: CreateTagInput) => fetchApi<Tag>('/api/tags', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  delete: (id: string) => fetchApi<void>(`/api/tags/${id}`, { method: 'DELETE' }),

  addToProject: (projectId: string, tagId: string) => fetchApi<void>('/api/project-tags', {
    method: 'POST',
    body: JSON.stringify({ projectId, tagId }),
  }),

  removeFromProject: (projectId: string, tagId: string) => fetchApi<void>(
    `/api/project-tags/${projectId}/${tagId}`,
    { method: 'DELETE' }
  ),
};

/**
 * Beads API
 */
export const beads = {
  read: (path: string) => fetchApi<{ beads: Bead[] }>(
    `/api/beads?path=${encodeURIComponent(path)}`
  ),

  addComment: (path: string, beadId: string, text: string, author: string) =>
    fetchApi<Bead>('/api/beads/comment', {
      method: 'POST',
      body: JSON.stringify({ path, bead_id: beadId, text, author }),
    }),
};

/**
 * BD CLI API
 */
export const bd = {
  command: (args: string[], cwd?: string) => fetchApi<BdCommandResult>('/api/bd/command', {
    method: 'POST',
    body: JSON.stringify({ args, cwd }),
  }),
};

/**
 * Git API
 */
export const git = {
  branchStatus: (path: string, branch: string) => fetchApi<BranchStatus>(
    `/api/git/branch-status?path=${encodeURIComponent(path)}&branch=${encodeURIComponent(branch)}`
  ),
};

/**
 * File System API
 */
export const fs = {
  list: (path: string) => fetchApi<{ entries: FsEntry[] }>(
    `/api/fs/list?path=${encodeURIComponent(path)}`
  ),

  exists: (path: string) => fetchApi<{ exists: boolean }>(
    `/api/fs/exists?path=${encodeURIComponent(path)}`
  ),
};

/**
 * File Watcher (Server-Sent Events)
 */
export const watch = {
  beads: (path: string, onEvent: (event: WatchEvent) => void) => {
    const eventSource = new EventSource(
      `${API_BASE}/api/watch/beads?path=${encodeURIComponent(path)}`
    );
    eventSource.onmessage = (e) => onEvent(JSON.parse(e.data));
    eventSource.onerror = () => eventSource.close();
    return () => eventSource.close();
  },
};
