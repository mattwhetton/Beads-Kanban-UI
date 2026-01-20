"use client";

import { cn } from "@/lib/utils";
import type { Bead, BeadStatus } from "@/types";
import { Check, Circle, Clock, FileCheck } from "lucide-react";

export interface SubtaskListProps {
  /** Child tasks to display */
  childTasks: Bead[];
  /** Callback when clicking a child task */
  onChildClick: (child: Bead) => void;
  /** Maximum number of children to show when collapsed */
  maxCollapsed?: number;
  /** Whether the list is expanded */
  isExpanded?: boolean;
}

/**
 * Get status icon based on bead status
 */
function getStatusIcon(status: BeadStatus) {
  switch (status) {
    case 'closed':
      return <Check className="h-3.5 w-3.5 text-green-600" aria-hidden="true" />;
    case 'in_progress':
      return <Clock className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />;
    case 'inreview':
      return <FileCheck className="h-3.5 w-3.5 text-purple-600" aria-hidden="true" />;
    case 'open':
    default:
      return <Circle className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />;
  }
}

/**
 * Get status text color
 */
function getStatusColor(status: BeadStatus): string {
  switch (status) {
    case 'closed':
      return "text-green-600";
    case 'in_progress':
      return "text-blue-600";
    case 'inreview':
      return "text-purple-600";
    case 'open':
    default:
      return "text-zinc-500";
  }
}

/**
 * Truncate text to max length
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "…";
}

/**
 * Compact list of child tasks within epic card
 */
export function SubtaskList({
  childTasks,
  onChildClick,
  maxCollapsed = 3,
  isExpanded = false
}: SubtaskListProps) {
  if (childTasks.length === 0) {
    return (
      <div className="text-xs text-muted-foreground italic">
        No child tasks
      </div>
    );
  }

  const displayChildren = isExpanded ? childTasks : childTasks.slice(0, maxCollapsed);
  const hasMore = childTasks.length > maxCollapsed && !isExpanded;

  return (
    <div className="space-y-1">
      {displayChildren.map((child) => (
        <button
          key={child.id}
          onClick={(e) => {
            e.stopPropagation();
            onChildClick(child);
          }}
          aria-label={`Open task: ${child.title}`}
          className={cn(
            "w-full flex items-start gap-2 px-2 py-1.5 rounded-md",
            "hover:bg-accent transition-colors text-left",
            "group"
          )}
        >
          <div className="flex-shrink-0 mt-0.5">
            {getStatusIcon(child.status)}
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn(
              "text-xs font-medium group-hover:underline",
              child.status === 'closed' && "line-through text-muted-foreground",
              child.status !== 'closed' && "text-foreground"
            )}>
              {truncate(child.title, 50)}
            </p>
            {child.description && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {truncate(child.description, 60)}
              </p>
            )}
          </div>
          <div className={cn(
            "flex-shrink-0 text-[9px] font-medium uppercase tracking-wide",
            getStatusColor(child.status)
          )}>
            {child.status.replace('_', ' ')}
          </div>
        </button>
      ))}
      {hasMore && (
        <p className="text-[10px] text-muted-foreground text-center py-1">
          +{childTasks.length - maxCollapsed} more
        </p>
      )}
    </div>
  );
}
