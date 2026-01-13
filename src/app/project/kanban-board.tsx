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
import type { Bead, BeadStatus } from "@/types";

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

  // Fetch branch statuses for all beads
  const beadIds = useMemo(() => beads.map((b) => b.id), [beads]);
  const { statuses: branchStatuses } = useBranchStatuses(
    project?.path ?? "",
    beadIds
  );

  /**
   * Group filtered beads by status for columns
   */
  const filteredBeadsByStatus = useMemo(() => {
    const grouped: Record<BeadStatus, Bead[]> = {
      open: [],
      in_progress: [],
      inreview: [],
      closed: [],
    };
    filteredBeads.forEach((bead) => {
      grouped[bead.status].push(bead);
    });
    return grouped;
  }, [filteredBeads]);

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

  // Keyboard navigation
  const { selectedId } = useKeyboardNavigation({
    beads: filteredBeads,
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
   */
  const handleSelectBead = (bead: Bead) => {
    setDetailBeadId(bead.id);
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
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    );
  }

  // Show loading state
  if (projectLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Loading project...</div>
      </div>
    );
  }

  // Show project error state
  if (projectError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <div className="text-destructive">Error: {projectError.message}</div>
        <Button variant="outline" asChild>
          <Link href="/">Back to projects</Link>
        </Button>
      </div>
    );
  }

  // Project not found
  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <div className="text-muted-foreground">Project not found</div>
        <Button variant="outline" asChild>
          <Link href="/">Back to projects</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b bg-background">
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
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Search beads... (press /)"
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
              className="pl-8 pr-8 w-[200px]"
            />
            {filters.search && (
              <button
                type="button"
                onClick={() => setFilters({ search: "" })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground"
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
                variant={activeFilterCount > 0 ? "secondary" : "outline"}
                size="sm"
                className="gap-1"
              >
                <Filter className="h-4 w-4" />
                Filter
                {activeFilterCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                    {activeFilterCount}
                  </span>
                )}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {/* Status Filter */}
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
            <div className="text-muted-foreground">Loading beads...</div>
          </div>
        ) : beadsError ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-destructive">Error loading beads: {beadsError.message}</div>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4 h-full">
            {COLUMNS.map(({ status, title }) => (
              <KanbanColumn
                key={status}
                status={status}
                title={title}
                beads={filteredBeadsByStatus[status] || []}
                selectedBeadId={selectedId}
                ticketNumbers={ticketNumbers}
                branchStatuses={branchStatuses}
                onSelectBead={handleSelectBead}
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
