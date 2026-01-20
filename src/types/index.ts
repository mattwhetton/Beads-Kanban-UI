/**
 * Project stored in local SQLite
 */
export interface Project {
  id: string;
  name: string;
  path: string;
  tags: Tag[];
  lastOpened: string;
  createdAt: string;
}

/**
 * Tag stored in local SQLite
 */
export interface Tag {
  id: string;
  name: string;
  color: string;
}

/**
 * Bead status types
 */
export type BeadStatus = 'open' | 'in_progress' | 'inreview' | 'closed';

/**
 * Bead from .beads/issues.jsonl
 */
export interface Bead {
  id: string;
  title: string;
  description?: string;
  status: BeadStatus;
  priority: number;
  issue_type: string;
  owner: string;
  created_at: string;
  updated_at: string;
  comments: Comment[];
  // Epic support fields
  parent_id?: string;         // ID of parent epic (for child tasks)
  children?: string[];        // IDs of child tasks (for epics)
  design_doc?: string;        // Path like ".designs/{EPIC_ID}.md"
  deps?: string[];            // Dependency IDs (blocking this task)
  blockers?: string[];        // COMPUTED: Tasks this blocks (derived from deps relationships)
}

/**
 * Comment from .beads/issues.jsonl
 */
export interface Comment {
  id: number;
  issue_id: string;
  author: string;
  text: string;
  created_at: string;
}

/**
 * Kanban column configuration
 */
export interface KanbanColumn {
  id: BeadStatus;
  title: string;
  beads: Bead[];
}

/**
 * GitHub PR info (for future integration)
 */
export interface PRInfo {
  url: string;
  state: 'OPEN' | 'MERGED' | 'CLOSED';
  reviewDecision: 'APPROVED' | 'CHANGES_REQUESTED' | 'REVIEW_REQUIRED' | null;
  statusCheckRollup: { state: 'SUCCESS' | 'FAILURE' | 'PENDING' } | null;
}

/**
 * Epic progress metrics (computed from children)
 */
export interface EpicProgress {
  total: number;       // Total number of child tasks
  completed: number;   // Number of children with status 'closed'
  inProgress: number;  // Number of children with status 'in_progress'
  blocked: number;     // Number of children with unresolved dependencies
}

/**
 * Epic-specific bead type
 */
export interface Epic extends Bead {
  issue_type: 'epic';
  children: string[];     // Epics always have children (required, not optional)
  progress?: EpicProgress; // Computed progress metrics
}
