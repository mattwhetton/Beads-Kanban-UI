"use client";

import Link from "next/link";
import { RoiuiCard, RoiuiCardContent, RoiuiCardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TagPicker } from "@/components/tag-picker";
import type { Tag } from "@/lib/db";

interface BeadCounts {
  open: number;
  in_progress: number;
  inreview: number;
  closed: number;
}

interface ProjectCardProps {
  id: string;
  name: string;
  path: string;
  tags: Tag[];
  lastOpened: string;
  beadCounts?: BeadCounts;
  onTagsChange?: (tags: Tag[]) => void;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return "just now";
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  } else if (diffDays < 30) {
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  } else {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
  }
}

export function ProjectCard({
  id,
  name,
  path,
  tags,
  lastOpened,
  beadCounts = { open: 0, in_progress: 0, inreview: 0, closed: 0 },
  onTagsChange,
}: ProjectCardProps) {
  const totalBeads = beadCounts.open + beadCounts.in_progress + beadCounts.inreview + beadCounts.closed;

  return (
    <Link href={`/project?id=${id}`}>
      <RoiuiCard className="cursor-pointer">
        <RoiuiCardContent>
          {/* Tags with add button */}
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            {tags.map((tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="text-xs"
                style={{
                  backgroundColor: `${tag.color}20`,
                  color: tag.color,
                  borderColor: tag.color,
                }}
              >
                {tag.name}
              </Badge>
            ))}
            {onTagsChange && (
              <div
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onKeyDown={(e) => e.stopPropagation()}
              >
                <TagPicker
                  projectId={id}
                  projectTags={tags}
                  onTagsChange={onTagsChange}
                />
              </div>
            )}
          </div>

          {/* Project Name */}
          <h3 className="text-balance font-semibold text-zinc-900">{name}</h3>

          {/* Path */}
          <p className="truncate text-sm text-zinc-500" title={path}>
            {path}
          </p>

          {/* Bead Counts */}
          {totalBeads > 0 && (
            <p className="text-sm text-zinc-600">
              <span className="text-blue-600">{beadCounts.open} open</span>
              {beadCounts.inreview > 0 && (
                <>
                  {" "}
                  <span className="text-zinc-400">·</span>{" "}
                  <span className="text-purple-600">{beadCounts.inreview} in review</span>
                </>
              )}
              {beadCounts.closed > 0 && (
                <>
                  {" "}
                  <span className="text-zinc-400">·</span>{" "}
                  <span className="text-green-600">{beadCounts.closed} closed</span>
                </>
              )}
            </p>
          )}
        </RoiuiCardContent>

        {/* Last Opened */}
        <RoiuiCardFooter>
          <p className="text-xs text-zinc-400">
            Last opened: {formatRelativeTime(lastOpened)}
          </p>
        </RoiuiCardFooter>
      </RoiuiCard>
    </Link>
  );
}
