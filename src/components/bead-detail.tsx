"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Bead, BeadStatus } from "@/types";
import { ArrowLeft, GitBranch, Calendar } from "lucide-react";
import { DesignDocViewer } from "@/components/design-doc-viewer";
import { SubtaskList } from "@/components/subtask-list";
import { useState, useEffect, useCallback, useMemo } from "react";

export interface BeadDetailProps {
  bead: Bead;
  ticketNumber?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children?: React.ReactNode;
  /** Project root path (absolute) */
  projectPath?: string;
  /** All beads for resolving child task IDs */
  allBeads?: Bead[];
  /** Callback when clicking a child task */
  onChildClick?: (child: Bead) => void;
}

/**
 * Get status badge color classes based on status
 */
function getStatusColor(status: BeadStatus): string {
  switch (status) {
    case "open":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "in_progress":
      return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    case "inreview":
      return "bg-purple-500/20 text-purple-400 border-purple-500/30";
    case "closed":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    default:
      return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
  }
}

/**
 * Get priority badge color classes based on priority level
 */
function getPriorityColor(priority: number): string {
  switch (priority) {
    case 0:
      return "bg-red-500/20 text-red-400 border-red-500/30";
    case 1:
      return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    case 2:
      return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
    default:
      return "bg-zinc-600/20 text-zinc-500 border-zinc-600/30";
  }
}

/**
 * Format status for display (e.g., "in_progress" -> "In Progress")
 */
function formatStatus(status: BeadStatus): string {
  switch (status) {
    case "open":
      return "Open";
    case "in_progress":
      return "In Progress";
    case "inreview":
      return "In Review";
    case "closed":
      return "Closed";
    default:
      return status;
  }
}

/**
 * Format bead ID for display (uppercase BD prefix)
 */
function formatBeadId(id: string): string {
  if (id.startsWith("BD-") || id.startsWith("bd-")) {
    return id.toUpperCase();
  }
  const parts = id.split("-");
  const shortId = parts[parts.length - 1];
  return `BD-${shortId.slice(0, 8).toUpperCase()}`;
}

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
    });
  } catch {
    return dateString;
  }
}

/**
 * Bead detail sheet component - slides in from the right
 * Displays full bead information with metadata grid and description
 *
 * Note: When DesignDocViewer goes fullscreen, we hide the Sheet via CSS and
 * override Radix's scroll lock to allow the MorphingDialog to function properly.
 * This avoids the conflict between Radix Dialog and MorphingDialog scroll locks.
 */
export function BeadDetail({
  bead,
  ticketNumber,
  open,
  onOpenChange,
  children,
  projectPath,
  allBeads,
  onChildClick,
}: BeadDetailProps) {
  const branchName = `bd-${formatBeadId(bead.id)}`;
  const [isDesignDocFullScreen, setIsDesignDocFullScreen] = useState(false);
  const hasDesignDoc = !!bead.design_doc;

  // Check if this is an epic with children
  const isEpic = bead.children && bead.children.length > 0;

  // Resolve children from IDs
  const childTasks = useMemo(() => {
    if (!isEpic || !allBeads) return [];
    return (bead.children || [])
      .map(childId => allBeads.find(b => b.id === childId))
      .filter((b): b is Bead => b !== undefined);
  }, [isEpic, bead.children, allBeads]);

  // Handle fullscreen state changes from DesignDocViewer
  const handleFullScreenChange = useCallback((isFullScreen: boolean) => {
    setIsDesignDocFullScreen(isFullScreen);
  }, []);

  // Override Radix's scroll lock when MorphingDialog is fullscreen
  // This fixes the pointer-events: none issue on body
  useEffect(() => {
    if (isDesignDocFullScreen) {
      // Remove Radix's scroll lock styles that conflict with MorphingDialog
      document.body.style.pointerEvents = '';
      document.body.style.overflow = 'hidden'; // MorphingDialog will manage this
    }
  }, [isDesignDocFullScreen]);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className={cn(
            "w-full sm:max-w-lg md:max-w-xl overflow-y-auto bg-[#0a0a0a] border-zinc-800",
            isDesignDocFullScreen && "invisible"
          )}
        >
          {/* Header with Back button */}
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="gap-1.5 -ml-2"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back
            </Button>
          </div>

          <SheetHeader className="space-y-4">
            {/* Ticket Number + Bead ID */}
            <SheetDescription className="text-xs font-mono text-zinc-500">
              {ticketNumber !== undefined && (
                <span className="font-semibold text-zinc-200">#{ticketNumber}</span>
              )}
              {ticketNumber !== undefined && " "}
              {formatBeadId(bead.id)}
            </SheetDescription>

            {/* Title */}
            <SheetTitle className="text-xl font-semibold leading-tight text-zinc-100">
              {bead.title}
            </SheetTitle>
          </SheetHeader>

          {/* Metadata Grid */}
          <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              {/* Status */}
              <div className="space-y-1">
                <span className="text-zinc-500 text-xs">Status</span>
                <div>
                  <Badge
                    variant="outline"
                    className={cn("font-medium", getStatusColor(bead.status))}
                  >
                    {formatStatus(bead.status)}
                  </Badge>
                </div>
              </div>

              {/* Priority */}
              <div className="space-y-1">
                <span className="text-zinc-500 text-xs">Priority</span>
                <div>
                  <Badge
                    variant="outline"
                    className={cn("font-medium", getPriorityColor(bead.priority))}
                  >
                    P{bead.priority}
                  </Badge>
                </div>
              </div>

              {/* Type */}
              <div className="space-y-1">
                <span className="text-zinc-500 text-xs">Type</span>
                <div>
                  <Badge variant="outline" className="font-normal capitalize text-zinc-200 border-zinc-700">
                    {bead.issue_type}
                  </Badge>
                </div>
              </div>

              {/* Branch */}
              <div className="space-y-1">
                <span className="text-zinc-500 text-xs">Branch</span>
                <div className="flex items-center gap-1.5">
                  <GitBranch className="h-3.5 w-3.5 text-zinc-500" aria-hidden="true" />
                  <span className="font-mono text-xs text-zinc-200">{branchName}</span>
                </div>
              </div>

              {/* Created */}
              <div className="space-y-1">
                <span className="text-zinc-500 text-xs">Created</span>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-zinc-500" aria-hidden="true" />
                  <span className="text-xs text-zinc-200">{formatDate(bead.created_at)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {bead.description && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold mb-2 text-zinc-200">Description</h3>
              <div className="h-px bg-zinc-800 mb-3" />
              <div className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">
                {bead.description}
              </div>
            </div>
          )}

          {/* Subtasks (for epics) */}
          {isEpic && onChildClick && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold mb-2 text-zinc-200">
                Subtasks ({childTasks.length})
              </h3>
              <div className="h-px bg-zinc-800 mb-3" />
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                <SubtaskList
                  childTasks={childTasks}
                  onChildClick={onChildClick}
                  isExpanded={true}
                />
              </div>
            </div>
          )}

          {/* Design Document */}
          {hasDesignDoc && projectPath && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold mb-3 text-zinc-200">Design Document</h3>
              <DesignDocViewer
                designDocPath={bead.design_doc!}
                epicId={formatBeadId(bead.id)}
                projectPath={projectPath}
                onFullScreenChange={handleFullScreenChange}
              />
            </div>
          )}

          {/* Children slot for comments + timeline */}
          {children && <div className="mt-6">{children}</div>}
        </SheetContent>
      </Sheet>
    </>
  );
}
