"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowLeft, Search, Filter, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { KanbanColumn } from "@/components/kanban-column";
import { BeadDetail } from "@/components/bead-detail";
import { CommentList } from "@/components/comment-list";
import { ActivityTimeline } from "@/components/activity-timeline";
import { EditableProjectName } from "@/components/editable-project-name";
import { useBeads } from "@/hooks/use-beads";
import { useProject } from "@/hooks/use-project";
import { useBeadFilters } from "@/hooks/use-bead-filters";
import { useBranchStatuses } from "@/hooks/use-branch-statuses";
import { useKeyboardNavigation } from "@/hooks/use-keyboard-navigation";
import type { Bead, BeadStatus, Epic } from "@/types";

/**
 * Column configuration for the Kanban board
 * Note: Cancelled status is hidden per requirements
 */
const COLUMNS: { status: BeadStatus; title: string }[] = [
  { status: "open", title: "Open" },
  { status: "in_progress", title: "In Progress" },
  { status: "inreview", title: "In Review" },
  { status: "closed", title: "Closed" },
];

/**
 * Status filter options
 */
const STATUSES: { value: BeadStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "inreview", label: "In Review" },
  { value: "closed", label: "Closed" },
];

/**
 * Priority filter options
 */
const PRIORITIES = [
  { value: 0, label: "P0 - Critical" },
  { value: 1, label: "P1 - High" },
  { value: 2, label: "P2 - Medium" },
  { value: 3, label: "P3 - Low" },
  { value: 4, label: "P4 - Trivial" },
];

/**
 * Issue type filter options
 */
type IssueTypeFilter = "all" | "epics" | "tasks";

const ISSUE_TYPES: { value: IssueTypeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "epics", label: "Epics Only" },
  { value: "tasks", label: "Tasks Only" },
];

/**
 * Main Kanban board component with 4 columns, search, filter, and keyboard navigation
 */
export default function KanbanBoard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get('id');

  // Fetch project data from SQLite
  const {
    project,
    isLoading: projectLoading,
    error: projectError,
    refetch: refetchProject,
  } = useProject(projectId);

  // Fetch beads from project path
  const {
    beads,
    beadsByStatus,
    ticketNumbers,
    isLoading: beadsLoading,
    error: beadsError,
    refresh: refreshBeads,
  } = useBeads(project?.path ?? "");

  // Use the bead filters hook with 300ms debounce
  const {
    filters,
    setFilters,
    filteredBeads,
    clearFilters,
    hasActiveFilters,
    activeFilterCount,
    availableOwners,
  } = useBeadFilters(beads, 300);

  // Issue type filter state (epics vs tasks)
  const [typeFilter, setTypeFilter] = useState<IssueTypeFilter>("all");

  // Fetch branch statuses for all beads
  const beadIds = useMemo(() => beads.map((b) => b.id), [beads]);
  const { statuses: branchStatuses } = useBranchStatuses(
    project?.path ?? "",
    beadIds
  );

  /**
   * Filter to only top-level beads (no parent_id)
   * Then apply issue type filter (epics vs tasks)
   * Child tasks should not appear in columns - they appear inside epic cards
   */
  const topLevelBeads = useMemo(() => {
    const topLevel = filteredBeads.filter(b => !b.parent_id);

    // Apply issue type filter
    if (typeFilter === "all") return topLevel;
    if (typeFilter === "epics") return topLevel.filter(b => b.issue_type === "epic");
    if (typeFilter === "tasks") return topLevel.filter(b => b.issue_type !== "epic");

    return topLevel;
  }, [filteredBeads, typeFilter]);

  /**
   * Group top-level beads by status for columns
   */
  const filteredBeadsByStatus = useMemo(() => {
    const grouped: Record<BeadStatus, Bead[]> = {
      open: [],
      in_progress: [],
      inreview: [],
      closed: [],
    };
    topLevelBeads.forEach((bead) => {
      grouped[bead.status].push(bead);
    });
    return grouped;
  }, [topLevelBeads]);

  // Detail sheet state
  const [detailBeadId, setDetailBeadId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Get the actual bead from the current beads array to ensure fresh data
  const detailBead = useMemo(() => {
    if (!detailBeadId) return null;
    return beads.find((b) => b.id === detailBeadId) || null;
  }, [detailBeadId, beads]);

  // Ref for search input (keyboard navigation)
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard navigation (use top-level beads for navigation)
  const { selectedId } = useKeyboardNavigation({
    beads: topLevelBeads,
    beadsByStatus: filteredBeadsByStatus,
    selectedId: null,
    onSelect: () => {
      // Just highlight, don't open detail
    },
    onOpen: (bead) => {
      setDetailBeadId(bead.id);
      setIsDetailOpen(true);
    },
    onClose: () => {
      setIsDetailOpen(false);
    },
    searchInputRef,
    isDetailOpen,
  });

  // Redirect if no project ID
  useEffect(() => {
    if (!projectId) {
      router.replace("/");
    }
  }, [projectId, router]);

  /**
   * Handle bead selection - opens detail panel
   * Works for both epics and standalone tasks
   */
  const handleSelectBead = (bead: Bead) => {
    setDetailBeadId(bead.id);
    setIsDetailOpen(true);
  };

  /**
   * Handle child task click from within an epic
   */
  const handleChildClick = (child: Bead) => {
    setDetailBeadId(child.id);
    setIsDetailOpen(true);
  };

  /**
   * Handle navigation to a dependency from DependencyBadge
   */
  const handleNavigateToDependency = (beadId: string) => {
    setDetailBeadId(beadId);
    setIsDetailOpen(true);
  };

  /**
   * Toggle status filter
   */
  const toggleStatus = (status: BeadStatus) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status];
    setFilters({ statuses: newStatuses });
  };

  /**
   * Toggle priority filter
   */
  const togglePriority = (priority: number) => {
    const newPriorities = filters.priorities.includes(priority)
      ? filters.priorities.filter((p) => p !== priority)
      : [...filters.priorities, priority];
    setFilters({ priorities: newPriorities });
  };

  /**
   * Toggle owner filter
   */
  const toggleOwner = (owner: string) => {
    const newOwners = filters.owners.includes(owner)
      ? filters.owners.filter((o) => o !== owner)
      : [...filters.owners, owner];
    setFilters({ owners: newOwners });
  };

  // Redirect state while no project ID
  if (!projectId) {
    return (
      <div className="dark flex min-h-dvh items-center justify-center bg-[#0a0a0a]">
        <p className="text-zinc-500">Redirecting…</p>
      </div>
    );
  }

  // Show loading state
  if (projectLoading) {
    return (
      <div className="dark flex items-center justify-center min-h-dvh bg-[#0a0a0a]">
        <div role="status" className="text-zinc-500">Loading project…</div>
      </div>
    );
  }

  // Show project error state
  if (projectError) {
    return (
      <div className="dark flex flex-col items-center justify-center min-h-dvh bg-[#0a0a0a] gap-4">
        <div role="alert" className="text-red-400">Error: {projectError.message}</div>
        <Button variant="outline" asChild>
          <Link href="/">Back to projects</Link>
        </Button>
      </div>
    );
  }

  // Project not found
  if (!project) {
    return (
      <div className="dark flex flex-col items-center justify-center min-h-dvh bg-[#0a0a0a] gap-4">
        <div className="text-zinc-500">Project not found</div>
        <Button variant="outline" asChild>
          <Link href="/">Back to projects</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="dark min-h-dvh bg-[#0a0a0a] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-800 bg-[#0a0a0a]/80 backdrop-blur-sm px-4 py-3">
        {/* Left: Back button + Project name */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to projects</span>
            </Link>
          </Button>
          <EditableProjectName
            projectId={project.id}
            initialName={project.name}
            onNameUpdated={refetchProject}
          />
        </div>

        {/* Right: Search + Filter */}
        <div className="flex items-center gap-2">
          {/* Search Input with Clear Button */}
          <div className="relative">
            <Search aria-hidden="true" className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              ref={searchInputRef}
              type="text"
              aria-label="Search beads"
              placeholder="Search beads… (press /)"
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
              className="pl-8 pr-8 w-[200px] bg-zinc-900/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-500"
            />
            {filters.search && (
              <button
                type="button"
                onClick={() => setFilters({ search: "" })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 hover:text-zinc-100"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={
                  activeFilterCount > 0
                    ? "gap-1 bg-zinc-800 text-zinc-100 border-zinc-700"
                    : "gap-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                }
              >
                <Filter aria-hidden="true" className="h-4 w-4" />
                Filter
                {activeFilterCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-zinc-600 text-zinc-100 rounded-full">
                    {activeFilterCount}
                  </span>
                )}
                <ChevronDown aria-hidden="true" className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {/* Issue Type Filter */}
              <DropdownMenuLabel>Issue Type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {ISSUE_TYPES.map(({ value, label }) => (
                <DropdownMenuCheckboxItem
                  key={value}
                  checked={typeFilter === value}
                  onCheckedChange={() => setTypeFilter(value)}
                >
                  {label}
                </DropdownMenuCheckboxItem>
              ))}

              {/* Status Filter */}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {STATUSES.map(({ value, label }) => (
                <DropdownMenuCheckboxItem
                  key={value}
                  checked={filters.statuses.includes(value)}
                  onCheckedChange={() => toggleStatus(value)}
                >
                  {label}
                </DropdownMenuCheckboxItem>
              ))}

              {/* Priority Filter */}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Priority</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {PRIORITIES.map(({ value, label }) => (
                <DropdownMenuCheckboxItem
                  key={value}
                  checked={filters.priorities.includes(value)}
                  onCheckedChange={() => togglePriority(value)}
                >
                  {label}
                </DropdownMenuCheckboxItem>
              ))}

              {/* Owner/Agent Filter */}
              {availableOwners.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Owner / Agent</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {availableOwners.map((owner) => (
                    <DropdownMenuCheckboxItem
                      key={owner}
                      checked={filters.owners.includes(owner)}
                      onCheckedChange={() => toggleOwner(owner)}
                    >
                      {owner}
                    </DropdownMenuCheckboxItem>
                  ))}
                </>
              )}

              {/* Clear Filters */}
              {hasActiveFilters && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={clearFilters}
                    className="text-destructive focus:text-destructive"
                  >
                    Clear filters
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Kanban Columns */}
      <main className="flex-1 overflow-hidden p-4">
        {beadsLoading ? (
          <div className="flex items-center justify-center h-full">
            <div role="status" className="text-zinc-500">Loading beads…</div>
          </div>
        ) : beadsError ? (
          <div className="flex items-center justify-center h-full">
            <div role="alert" className="text-red-400">Error loading beads: {beadsError.message}</div>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4 h-full">
            {COLUMNS.map(({ status, title }) => (
              <KanbanColumn
                key={status}
                status={status}
                title={title}
                beads={filteredBeadsByStatus[status] || []}
                allBeads={beads}
                selectedBeadId={selectedId}
                ticketNumbers={ticketNumbers}
                branchStatuses={branchStatuses}
                onSelectBead={handleSelectBead}
                onChildClick={handleChildClick}
                onNavigateToDependency={handleNavigateToDependency}
                projectPath={project?.path}
              />
            ))}
          </div>
        )}
      </main>

      {/* Bead Detail Sheet */}
      {detailBead && (
        <BeadDetail
          bead={detailBead}
          ticketNumber={ticketNumbers.get(detailBead.id)}
          open={isDetailOpen}
          onOpenChange={(open) => {
            setIsDetailOpen(open);
            if (!open) {
              setDetailBeadId(null);
            }
          }}
          projectPath={project?.path ?? ""}
        >
          <CommentList
            comments={detailBead.comments}
            beadId={detailBead.id}
            projectPath={project?.path ?? ""}
            onCommentAdded={refreshBeads}
          />
          <ActivityTimeline bead={detailBead} comments={detailBead.comments} />
        </BeadDetail>
      )}
    </div>
  );
}
