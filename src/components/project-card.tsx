"use client";

import { useRouter } from "next/navigation";
import { FolderKanban } from "lucide-react";
import {
  RoiuiCard,
  RoiuiCardAction,
  RoiuiCardContent,
  RoiuiCardDescription,
  RoiuiCardHeader,
  RoiuiCardIcon,
  RoiuiCardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TagPicker } from "@/components/tag-picker";
import type { Tag } from "@/lib/db";
import type { BeadCounts } from "@/types";

/**
 * Converts kebab-case, snake_case, camelCase to Title Case with spaces
 */
function formatProjectName(name: string): string {
  return name
    .replace(/[-_]/g, ' ')  // Replace hyphens and underscores with spaces
    .replace(/([a-z])([A-Z])/g, '$1 $2')  // Add space before capitals in camelCase
    .replace(/\b\w/g, c => c.toUpperCase());  // Capitalize first letter of each word
}

interface ProjectCardProps {
  id: string;
  name: string;
  path: string;
  tags: Tag[];
  beadCounts?: BeadCounts;
  onTagsChange?: (tags: Tag[]) => void;
}

export function ProjectCard({
  id,
  name,
  path,
  tags,
  beadCounts = { open: 0, in_progress: 0, inreview: 0, closed: 0 },
  onTagsChange,
}: ProjectCardProps) {
  const router = useRouter();
  const totalBeads = beadCounts.open + beadCounts.in_progress + beadCounts.inreview + beadCounts.closed;

  const handleCardClick = () => {
    router.push(`/project?id=${id}`);
  };

  return (
    <RoiuiCard
      className="cursor-pointer"
      onClick={handleCardClick}
      role="link"
      tabIndex={0}
      aria-label={`View ${formatProjectName(name)} project`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCardClick();
        }
      }}
    >
      <RoiuiCardHeader>
        <RoiuiCardIcon>
          <FolderKanban className="size-5" aria-hidden="true" />
        </RoiuiCardIcon>
        <RoiuiCardTitle className="text-balance font-project-name">
          {formatProjectName(name)}
        </RoiuiCardTitle>
        <RoiuiCardDescription className="truncate" title={path}>
          {path}
        </RoiuiCardDescription>
        <RoiuiCardAction>
          <div
            className="flex min-w-0 flex-wrap items-center gap-1.5"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {tags.map((tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                size="sm"
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
              <TagPicker
                projectId={id}
                projectTags={tags}
                onTagsChange={onTagsChange}
              />
            )}
          </div>
        </RoiuiCardAction>
      </RoiuiCardHeader>
      <RoiuiCardContent>
        {totalBeads > 0 ? (
          <p className="text-sm text-zinc-400">
            <span className="text-blue-400">{beadCounts.open} open</span>
            {beadCounts.inreview > 0 && (
              <>
                {" "}
                <span className="text-zinc-500">·</span>{" "}
                <span className="text-purple-400">{beadCounts.inreview} in review</span>
              </>
            )}
            {beadCounts.closed > 0 && (
              <>
                {" "}
                <span className="text-zinc-500">·</span>{" "}
                <span className="text-green-400">{beadCounts.closed} closed</span>
              </>
            )}
          </p>
        ) : (
          <p className="text-sm text-zinc-500">No tasks yet</p>
        )}
      </RoiuiCardContent>
    </RoiuiCard>
  );
}
