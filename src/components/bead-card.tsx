"use client";

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
 * Dark theme variant with semi-transparent backgrounds
 */
function getPriorityColor(priority: number): string {
  switch (priority) {
    case 0:
      return "bg-red-500/20 text-red-400 border border-red-500/30";
    case 1:
      return "bg-orange-500/20 text-orange-400 border border-orange-500/30";
    case 2:
      return "bg-zinc-500/20 text-zinc-400 border border-zinc-500/30";
    default:
      return "bg-zinc-600/20 text-zinc-500 border border-zinc-600/30";
  }
}

/**
 * Get branch badge color based on ahead/behind status
 * Dark theme variant with semi-transparent backgrounds
 * Green: ahead only (has new commits, up to date with main)
 * Yellow: behind only (main has new commits)
 * Red: diverged (both ahead and behind)
 * Default green: up to date (ahead=0, behind=0)
 */
function getBranchBadgeColor(status: BranchStatus): string {
  const { ahead, behind } = status;

  if (ahead > 0 && behind > 0) {
    // Diverged - red
    return "bg-red-500/10 text-red-400 border-red-600/30";
  } else if (behind > 0) {
    // Behind main - yellow
    return "bg-yellow-500/10 text-yellow-400 border-yellow-600/30";
  } else {
    // Ahead only or up to date - green
    return "bg-green-500/10 text-green-400 border-green-600/30";
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
 * Detect if bead is blocked by checking for unresolved dependencies
 * A task is blocked only if it has unresolved dependencies
 * Closed tasks are never blocked (they've completed)
 * Note: The deps field only contains UNRESOLVED dependencies (backend filters out closed deps)
 */
function isBlocked(bead: Bead): boolean {
  // Closed tasks are never blocked (they've completed)
  if (bead.status === 'closed') return false;
  // A task is blocked if it has unresolved dependencies
  return (bead.deps ?? []).length > 0;
}

/**
 * Truncate text to a maximum length with ellipsis
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "…";
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
    <div
      data-bead-id={bead.id}
      role="button"
      tabIndex={0}
      aria-label={`Select bead: ${bead.title}`}
      className={cn(
        "rounded-lg cursor-pointer p-4",
        "bg-zinc-900/70 backdrop-blur-md",
        "border border-zinc-800/60",
        "shadow-sm shadow-black/20",
        "transition-[transform,box-shadow,border-color] duration-200",
        "hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/30",
        "hover:border-zinc-700",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]",
        blocked ? "border-l-4 border-l-red-500" : "border-l-4 border-l-transparent",
        isSelected && "ring-2 ring-zinc-400 ring-offset-2 ring-offset-[#0a0a0a]"
      )}
      onClick={() => onSelect(bead)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(bead);
        }
      }}
    >
      <div className="space-y-3">
        {/* Header: Ticket # + ID + Priority + Blocked badge */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-zinc-500">
            {ticketNumber !== undefined && (
              <span className="font-semibold text-zinc-100">#{ticketNumber}</span>
            )}
            {ticketNumber !== undefined && " "}
            {formatBeadId(bead.id)}
          </span>
          <div className="flex items-center gap-1.5">
            {blocked && (
              <Badge
                className="text-[10px] px-1.5 py-0 bg-red-500/20 text-red-400 border border-red-500/30"
              >
                BLOCKED
              </Badge>
            )}
            <Badge
              className={cn(
                "text-[10px] px-1.5 py-0",
                getPriorityColor(bead.priority)
              )}
            >
              P{bead.priority}
            </Badge>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-sm leading-tight text-zinc-100">
          {truncate(bead.title, 60)}
        </h3>

        {/* Description (truncated, muted) */}
        {bead.description && (
          <p className="text-xs text-zinc-400 leading-relaxed">
            {truncate(bead.description, 80)}
          </p>
        )}

        {/* Footer: comment count */}
        {commentCount > 0 && (
          <div className="flex items-center pt-1">
            <span className="flex items-center gap-1 text-[10px] text-zinc-500">
              <MessageSquare className="h-3 w-3" aria-hidden="true" />
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
              <GitBranch className="h-3 w-3 mr-1" aria-hidden="true" />
              {formatBranchStatus(bead.id, branchStatus)}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}
