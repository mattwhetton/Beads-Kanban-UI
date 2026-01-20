"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { BeadCard } from "@/components/bead-card";
import { EpicCard } from "@/components/epic-card";
import { cn } from "@/lib/utils";
import type { Bead, BeadStatus, Epic } from "@/types";
import type { BranchStatus } from "@/lib/git";

export interface KanbanColumnProps {
  status: BeadStatus;
  title: string;
  beads: Bead[];
  /** All beads for resolving epic children */
  allBeads: Bead[];
  selectedBeadId?: string | null;
  ticketNumbers?: Map<string, number>;
  branchStatuses?: Record<string, BranchStatus>;
  onSelectBead: (bead: Bead) => void;
  onChildClick?: (child: Bead) => void;
  onNavigateToDependency?: (beadId: string) => void;
  /** Project root path for fetching design docs */
  projectPath?: string;
}

/**
 * Get background color class for column based on status
 */
function getColumnBackground(status: BeadStatus): string {
  switch (status) {
    case "open":
      return "bg-blue-50";
    case "in_progress":
      return "bg-amber-50";
    case "inreview":
      return "bg-purple-50";
    case "closed":
      return "bg-green-50";
    default:
      return "bg-zinc-50";
  }
}

/**
 * Get badge color class for count badge based on status
 */
function getBadgeVariant(status: BeadStatus): string {
  switch (status) {
    case "open":
      return "bg-blue-100 text-blue-700 hover:bg-blue-100";
    case "in_progress":
      return "bg-amber-100 text-amber-700 hover:bg-amber-100";
    case "inreview":
      return "bg-purple-100 text-purple-700 hover:bg-purple-100";
    case "closed":
      return "bg-green-100 text-green-700 hover:bg-green-100";
    default:
      return "bg-zinc-100 text-zinc-700 hover:bg-zinc-100";
  }
}

/**
 * Type guard to check if a bead is an epic
 */
function isEpic(bead: Bead): bead is Epic {
  return bead.issue_type === 'epic';
}

/**
 * Reusable Kanban column component with header, count badge, and scrollable bead list
 * Renders EpicCard for epics and BeadCard for standalone tasks
 */
export function KanbanColumn({
  status,
  title,
  beads,
  allBeads,
  selectedBeadId,
  ticketNumbers,
  branchStatuses = {},
  onSelectBead,
  onChildClick,
  onNavigateToDependency,
  projectPath,
}: KanbanColumnProps) {
  return (
    <div
      className={cn(
        "flex flex-col h-full min-h-0 rounded-lg border",
        getColumnBackground(status)
      )}
    >
      {/* Column Header - fixed height */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b bg-white/50">
        <h2 className="font-semibold text-sm">{title}</h2>
        <Badge
          variant="secondary"
          className={cn("text-xs px-2 py-0.5", getBadgeVariant(status))}
        >
          {beads.length}
        </Badge>
      </div>

      {/* Scrollable Bead List */}
      <ScrollArea className="flex-1 min-h-0 p-3">
        <div className="space-y-3">
          {beads.map((bead) => {
            // Render EpicCard for epics, BeadCard for standalone tasks
            if (isEpic(bead)) {
              return (
                <EpicCard
                  key={bead.id}
                  epic={bead}
                  allBeads={allBeads}
                  ticketNumber={ticketNumbers?.get(bead.id)}
                  isSelected={selectedBeadId === bead.id}
                  onSelect={onSelectBead}
                  onChildClick={onChildClick ?? onSelectBead}
                  onNavigateToDependency={onNavigateToDependency}
                  projectPath={projectPath}
                />
              );
            }

            return (
              <BeadCard
                key={bead.id}
                bead={bead}
                ticketNumber={ticketNumbers?.get(bead.id)}
                isSelected={selectedBeadId === bead.id}
                branchStatus={branchStatuses[bead.id]}
                onSelect={onSelectBead}
              />
            );
          })}
          {beads.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No beads
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
