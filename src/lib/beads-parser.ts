/**
 * Parser for beads data via HTTP API
 *
 * Fetches and provides typed access to beads with helper functions for
 * common operations.
 */

import * as api from './api';
import type { Bead, BeadStatus } from "@/types";

/**
 * Loads beads from a project directory via API
 *
 * @param projectPath - The root path of the project
 * @returns Promise resolving to array of Bead objects
 *
 * @example
 * ```typescript
 * const beads = await loadProjectBeads('/path/to/project');
 * ```
 */
export async function loadProjectBeads(projectPath: string): Promise<Bead[]> {
  try {
    const result = await api.beads.read(projectPath);
    // Ensure every bead has a comments array (defensive against null/undefined)
    return result.beads.map((bead) => ({
      ...bead,
      comments: bead.comments ?? [],
    }));
  } catch (error) {
    console.error(`Failed to load beads from ${projectPath}:`, error);
    return [];
  }
}

/**
 * Alias for loadProjectBeads for backward compatibility
 */
export async function parseBeadsFromPath(projectPath: string): Promise<Bead[]> {
  return loadProjectBeads(projectPath);
}

/**
 * Groups beads by their status into a record
 *
 * @param beads - Array of Bead objects to group
 * @returns Record with status keys and arrays of beads as values
 *
 * @example
 * ```typescript
 * const grouped = groupBeadsByStatus(beads);
 * console.log(grouped.open.length); // Number of open beads
 * console.log(grouped.closed.length); // Number of closed beads
 * ```
 */
export function groupBeadsByStatus(beads: Bead[]): Record<BeadStatus, Bead[]> {
  const grouped: Record<BeadStatus, Bead[]> = {
    open: [],
    in_progress: [],
    inreview: [],
    closed: [],
  };

  for (const bead of beads) {
    grouped[bead.status].push(bead);
  }

  // Sort each group by updated_at descending (most recent first)
  for (const status of Object.keys(grouped) as BeadStatus[]) {
    grouped[status].sort((a, b) => {
      const dateA = new Date(a.updated_at).getTime();
      const dateB = new Date(b.updated_at).getTime();
      return dateB - dateA;
    });
  }

  return grouped;
}

/**
 * Finds a bead by its ID
 *
 * @param beads - Array of Bead objects to search
 * @param id - The bead ID to find
 * @returns The matching Bead or undefined if not found
 *
 * @example
 * ```typescript
 * const bead = getBeadById(beads, 'beads-kanban-ui-323');
 * if (bead) {
 *   console.log(bead.title);
 * }
 * ```
 */
export function getBeadById(beads: Bead[], id: string): Bead | undefined {
  return beads.find((bead) => bead.id === id);
}

/**
 * Constructs the path to issues.jsonl from a project path
 *
 * @param projectPath - The root path of the project
 * @returns Path to the issues.jsonl file
 */
export function getBeadsFilePath(projectPath: string): string {
  // Normalize path separators and ensure no trailing slash
  const normalizedPath = projectPath.replace(/\\/g, "/").replace(/\/$/, "");
  return `${normalizedPath}/.beads/issues.jsonl`;
}

/**
 * Assigns sequential ticket numbers to beads based on creation order
 *
 * @param beads - Array of Bead objects to assign numbers to
 * @returns Map of bead ID to ticket number (1-indexed, oldest bead = #1)
 *
 * @example
 * ```typescript
 * const ticketNumbers = assignTicketNumbers(beads);
 * const ticketNum = ticketNumbers.get('beads-kanban-ui-323'); // e.g., 5
 * console.log(`#${ticketNum}`); // "#5"
 * ```
 */
export function assignTicketNumbers(beads: Bead[]): Map<string, number> {
  // Sort all beads by created_at ascending (oldest first)
  const sortedBeads = [...beads].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return dateA - dateB;
  });

  // Assign 1-indexed ticket numbers
  const ticketNumbers = new Map<string, number>();
  sortedBeads.forEach((bead, index) => {
    ticketNumbers.set(bead.id, index + 1);
  });

  return ticketNumbers;
}
