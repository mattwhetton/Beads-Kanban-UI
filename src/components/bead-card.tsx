"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Bead } from "@/types";
import type { BranchStatus } from "@/lib/git";
import { GitBranch, MessageSquare } from "lucide-react";

export interface BeadCardProps {
  bead: Bead;
  ticketNumber?: number;
  branchStatus?: BranchStatus;
  isSelected?: boolean;
  onSelect: (bead: Bead) => void;
}

/**
 * Get priority badge color classes based on priority level
 * P0=red-500, P1=orange-500, P2=zinc-400, P3/P4=zinc-300
 */
function getPriorityColor(priority: number): string {
  switch (priority) {
    case 0:
      return "bg-red-500 text-white hover:bg-red-500/80";
    case 1:
      return "bg-orange-500 text-white hover:bg-orange-500/80";
    case 2:
      return "bg-zinc-400 text-white hover:bg-zinc-400/80";
    default:
      return "bg-zinc-300 text-zinc-700 hover:bg-zinc-300/80";
  }
}

/**
 * Get branch badge color based on ahead/behind status
 * Green: ahead only (has new commits, up to date with main)
 * Yellow: behind only (main has new commits)
 * Red: diverged (both ahead and behind)
 * Default green: up to date (ahead=0, behind=0)
 */
function getBranchBadgeColor(status: BranchStatus): string {
  const { ahead, behind } = status;

  if (ahead > 0 && behind > 0) {
    // Diverged - red
    return "border-red-600 text-red-600 bg-red-50";
  } else if (behind > 0) {
    // Behind main - yellow
    return "border-yellow-600 text-yellow-600 bg-yellow-50";
  } else {
    // Ahead only or up to date - green
    return "border-green-600 text-green-600 bg-green-50";
  }
}

/**
 * Format branch status display
 * Returns: "bd-ID" if up to date, "bd-ID +ahead -behind" otherwise
 */
function formatBranchStatus(beadId: string, status: BranchStatus): string {
  const formattedId = `bd-${formatBeadId(beadId)}`;
  const { ahead, behind } = status;

  if (ahead === 0 && behind === 0) {
    return formattedId;
  }

  const parts = [formattedId];
  if (ahead > 0) {
    parts.push(`+${ahead}`);
  }
  if (behind > 0) {
    parts.push(`-${behind}`);
  }

  return parts.join(" ");
}

/**
 * Detect if bead is blocked by checking comments for "BLOCKED" keyword
 */
function isBlocked(bead: Bead): boolean {
  return (bead.comments ?? []).some((comment) =>
    comment.text.toUpperCase().includes("BLOCKED")
  );
}

/**
 * Truncate text to a maximum length with ellipsis
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
}

/**
 * Format bead ID for display (short form)
 */
function formatBeadId(id: string): string {
  // If ID is like "project-abc123", show "BD-abc123"
  // If already has BD prefix, show as-is but truncate if needed
  if (id.startsWith("BD-") || id.startsWith("bd-")) {
    return id.length > 10 ? `BD-${id.slice(-6)}` : id.toUpperCase();
  }
  // Extract last part after dash
  const parts = id.split("-");
  const shortId = parts[parts.length - 1];
  return `BD-${shortId.slice(0, 6)}`;
}

export function BeadCard({ bead, ticketNumber, branchStatus, isSelected = false, onSelect }: BeadCardProps) {
  const blocked = isBlocked(bead);
  const commentCount = (bead.comments ?? []).length;
  const branchExists = branchStatus?.exists ?? false;

  return (
    <Card
      data-bead-id={bead.id}
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        "border-l-4",
        blocked ? "border-l-red-500" : "border-l-transparent",
        isSelected && "ring-2 ring-primary ring-offset-2 shadow-md"
      )}
      onClick={() => onSelect(bead)}
    >
      <div className="p-4 space-y-3">
        {/* Header: Ticket # + ID + Priority + Blocked badge */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-muted-foreground">
            {ticketNumber !== undefined && (
              <span className="font-semibold text-foreground">#{ticketNumber}</span>
            )}
            {ticketNumber !== undefined && " "}
            {formatBeadId(bead.id)}
          </span>
          <div className="flex items-center gap-1.5">
            {blocked && (
              <Badge
                variant="destructive"
                className="text-[10px] px-1.5 py-0"
              >
                BLOCKED
              </Badge>
            )}
            <Badge
              className={cn(
                "text-[10px] px-1.5 py-0 border-transparent",
                getPriorityColor(bead.priority)
              )}
            >
              P{bead.priority}
            </Badge>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-sm leading-tight">
          {truncate(bead.title, 60)}
        </h3>

        {/* Description (truncated, muted) */}
        {bead.description && (
          <p className="text-xs text-muted-foreground leading-relaxed">
            {truncate(bead.description, 80)}
          </p>
        )}

        {/* Footer: comment count */}
        {commentCount > 0 && (
          <div className="flex items-center pt-1">
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              {commentCount} {commentCount === 1 ? "comment" : "comments"}
            </span>
          </div>
        )}

        {/* Branch badge with ahead/behind status */}
        {branchExists && branchStatus && (
          <div className="pt-1">
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] px-2 py-0.5 font-mono",
                getBranchBadgeColor(branchStatus)
              )}
            >
              <GitBranch className="h-3 w-3 mr-1" />
              {formatBranchStatus(bead.id, branchStatus)}
            </Badge>
          </div>
        )}
      </div>
    </Card>
  );
}
