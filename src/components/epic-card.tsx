"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Bead, Epic, EpicProgress } from "@/types";
import { ChevronDown, ChevronRight, FileText, Layers, MessageSquare } from "lucide-react";
import { SubtaskList } from "@/components/subtask-list";
import { DependencyBadge } from "@/components/dependency-badge";

export interface EpicCardProps {
  /** Epic bead with children */
  epic: Epic;
  /** All beads to resolve children */
  allBeads: Bead[];
  /** Ticket number for display */
  ticketNumber?: number;
  /** Whether this epic is selected */
  isSelected?: boolean;
  /** Callback when selecting this epic */
  onSelect: (epic: Epic) => void;
  /** Callback when clicking a child task */
  onChildClick: (child: Bead) => void;
  /** Callback when navigating to a dependency */
  onNavigateToDependency?: (beadId: string) => void;
}

/**
 * Get priority badge color classes based on priority level
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
 * Format bead ID for display
 */
function formatBeadId(id: string): string {
  if (id.startsWith("BD-") || id.startsWith("bd-")) {
    return id.length > 10 ? 'BD-' + id.slice(-6) : id.toUpperCase();
  }
  const parts = id.split("-");
  const shortId = parts[parts.length - 1];
  return 'BD-' + shortId.slice(0, 6);
}

/**
 * Truncate text to max length
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
}

/**
 * Compute epic progress from children
 */
function computeProgress(children: Bead[]): EpicProgress {
  const total = children.length;
  const completed = children.filter(c => c.status === 'closed').length;
  const inProgress = children.filter(c => c.status === 'in_progress').length;
  const blocked = children.filter(c => (c.deps?.length ?? 0) > 0).length;
  
  return { total, completed, inProgress, blocked };
}

/**
 * Get progress bar color based on completion percentage
 */
function getProgressColor(percentage: number): string {
  if (percentage === 100) return "bg-green-600";
  if (percentage >= 75) return "bg-green-500";
  if (percentage >= 50) return "bg-blue-500";
  if (percentage >= 25) return "bg-amber-500";
  return "bg-zinc-400";
}

/**
 * Larger epic card with distinctive styling
 */
export function EpicCard({
  epic,
  allBeads,
  ticketNumber,
  isSelected = false,
  onSelect,
  onChildClick,
  onNavigateToDependency
}: EpicCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Resolve children from IDs
  const children = (epic.children || [])
    .map(childId => allBeads.find(b => b.id === childId))
    .filter((b): b is Bead => b !== undefined);

  const progress = computeProgress(children);
  const progressPercentage = progress.total > 0 
    ? Math.round((progress.completed / progress.total) * 100) 
    : 0;

  const commentCount = (epic.comments ?? []).length;
  const hasDesignDoc = !!epic.design_doc;

  return (
    <Card
      data-bead-id={epic.id}
      className={cn(
        "cursor-pointer transition-all hover:shadow-lg",
        "border-l-4 border-l-purple-500",
        "bg-gradient-to-br from-background to-purple-50/30 dark:to-purple-950/10",
        isSelected && "ring-2 ring-purple-500 ring-offset-2 shadow-lg"
      )}
      onClick={() => onSelect(epic)}
    >
      <div className="p-4 space-y-3">
        {/* Header: Ticket # + Epic Icon + ID + Priority + Design Doc + Dependencies */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-purple-600" />
            <span className="text-xs font-mono text-muted-foreground">
              {ticketNumber !== undefined && (
                <span className="font-semibold text-foreground">#{ticketNumber}</span>
              )}
              {ticketNumber !== undefined && " "}
              {formatBeadId(epic.id)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {hasDesignDoc && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 border-purple-300 text-purple-700 bg-purple-50"
              >
                <FileText className="h-3 w-3 mr-0.5" />
                DESIGN
              </Badge>
            )}
            <DependencyBadge
              deps={epic.deps}
              blockers={epic.blockers}
              onNavigate={onNavigateToDependency}
            />
            <Badge
              className={cn(
                "text-[10px] px-1.5 py-0 border-transparent",
                getPriorityColor(epic.priority)
              )}
            >
              P{epic.priority}
            </Badge>
          </div>
        </div>

        {/* Epic Badge */}
        <Badge
          variant="outline"
          className="text-[10px] px-2 py-0.5 border-purple-300 text-purple-700 bg-purple-50 font-semibold"
        >
          EPIC
        </Badge>

        {/* Title */}
        <h3 className="font-bold text-base leading-tight text-purple-900 dark:text-purple-100">
          {truncate(epic.title, 60)}
        </h3>

        {/* Description */}
        {epic.description && (
          <p className="text-xs text-muted-foreground leading-relaxed">
            {truncate(epic.description, 100)}
          </p>
        )}

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Progress: {progress.completed}/{progress.total} completed
            </span>
            <span className="font-semibold">{progressPercentage}%</span>
          </div>
          <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-300",
                getProgressColor(progressPercentage)
              )}
              style={{ width: progressPercentage + '%' }}
            />
          </div>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              {progress.inProgress} in progress
            </span>
            {progress.blocked > 0 && (
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                {progress.blocked} blocked
              </span>
            )}
          </div>
        </div>

        {/* Children Preview/List */}
        <div className="pt-2 border-t border-purple-200 dark:border-purple-900/30">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="flex items-center gap-1 text-xs font-semibold text-purple-700 dark:text-purple-300 hover:underline mb-2"
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
            Child Tasks ({children.length})
          </button>
          <SubtaskList
            children={children}
            onChildClick={onChildClick}
            maxCollapsed={3}
            isExpanded={isExpanded}
          />
        </div>

        {/* Footer: comment count */}
        {commentCount > 0 && (
          <div className="flex items-center pt-2">
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              {commentCount} {commentCount === 1 ? "comment" : "comments"}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
