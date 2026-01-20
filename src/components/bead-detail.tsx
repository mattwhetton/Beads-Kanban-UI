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
import { ArrowLeft, GitBranch, Calendar, ChevronDown, ChevronRight } from "lucide-react";
import { DesignDocViewer } from "@/components/design-doc-viewer";
import { useState } from "react";

export interface BeadDetailProps {
  bead: Bead;
  ticketNumber?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children?: React.ReactNode;
  /** Project root path (absolute) */
  projectPath?: string;
}

/**
 * Get status badge color classes based on status
 */
function getStatusColor(status: BeadStatus): string {
  switch (status) {
    case "open":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "in_progress":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "inreview":
      return "bg-purple-100 text-purple-700 border-purple-200";
    case "closed":
      return "bg-green-100 text-green-700 border-green-200";
    default:
      return "bg-zinc-100 text-zinc-700 border-zinc-200";
  }
}

/**
 * Get priority badge color classes based on priority level
 */
function getPriorityColor(priority: number): string {
  switch (priority) {
    case 0:
      return "bg-red-500 text-white border-transparent";
    case 1:
      return "bg-orange-500 text-white border-transparent";
    case 2:
      return "bg-zinc-400 text-white border-transparent";
    default:
      return "bg-zinc-300 text-zinc-700 border-transparent";
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
 */
export function BeadDetail({
  bead,
  ticketNumber,
  open,
  onOpenChange,
  children,
  projectPath,
}: BeadDetailProps) {
  const branchName = `bd-${formatBeadId(bead.id)}`;
  const [isDesignDocExpanded, setIsDesignDocExpanded] = useState(true);
  const hasDesignDoc = !!bead.design_doc;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg md:max-w-xl overflow-y-auto"
      >
        {/* Header with Back button */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="gap-1.5 -ml-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        <SheetHeader className="space-y-4">
          {/* Ticket Number + Bead ID */}
          <SheetDescription className="text-xs font-mono text-muted-foreground">
            {ticketNumber !== undefined && (
              <span className="font-semibold text-foreground">#{ticketNumber}</span>
            )}
            {ticketNumber !== undefined && " "}
            {formatBeadId(bead.id)}
          </SheetDescription>

          {/* Title */}
          <SheetTitle className="text-xl font-semibold leading-tight">
            {bead.title}
          </SheetTitle>
        </SheetHeader>

        {/* Metadata Grid */}
        <div className="mt-6 rounded-lg border bg-muted/30 p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            {/* Status */}
            <div className="space-y-1">
              <span className="text-muted-foreground text-xs">Status</span>
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
              <span className="text-muted-foreground text-xs">Priority</span>
              <div>
                <Badge
                  className={cn("font-medium", getPriorityColor(bead.priority))}
                >
                  P{bead.priority}
                </Badge>
              </div>
            </div>

            {/* Type */}
            <div className="space-y-1">
              <span className="text-muted-foreground text-xs">Type</span>
              <div>
                <Badge variant="outline" className="font-normal capitalize">
                  {bead.issue_type}
                </Badge>
              </div>
            </div>

            {/* Branch */}
            <div className="space-y-1">
              <span className="text-muted-foreground text-xs">Branch</span>
              <div className="flex items-center gap-1.5">
                <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-mono text-xs">{branchName}</span>
              </div>
            </div>

            {/* Created */}
            <div className="space-y-1">
              <span className="text-muted-foreground text-xs">Created</span>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs">{formatDate(bead.created_at)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        {bead.description && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold mb-2">Description</h3>
            <div className="h-px bg-border mb-3" />
            <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {bead.description}
            </div>
          </div>
        )}

        {/* Design Document */}
        {hasDesignDoc && (
          <div className="mt-6">
            <button
              onClick={() => setIsDesignDocExpanded(!isDesignDocExpanded)}
              aria-expanded={isDesignDocExpanded}
              aria-label={`${isDesignDocExpanded ? 'Collapse' : 'Expand'} design document`}
              className="flex items-center gap-1.5 text-sm font-semibold mb-3 hover:underline transition-[color,text-decoration-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {isDesignDocExpanded ? (
                <ChevronDown className="size-4" aria-hidden="true" />
              ) : (
                <ChevronRight className="size-4" aria-hidden="true" />
              )}
              Design Document
            </button>
            {isDesignDocExpanded && projectPath && (
              <DesignDocViewer
                designDocPath={bead.design_doc!}
                epicId={formatBeadId(bead.id)}
                projectPath={projectPath}
              />
            )}
          </div>
        )}

        {/* Children slot for comments + timeline */}
        {children && <div className="mt-6">{children}</div>}
      </SheetContent>
    </Sheet>
  );
}
