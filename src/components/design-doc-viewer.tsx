"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { FileText, Loader2 } from "lucide-react";
import {
  MorphingDialog,
  MorphingDialogTrigger,
  MorphingDialogContent,
  MorphingDialogContainer,
  MorphingDialogClose,
  MorphingDialogTitle,
  MorphingDialogDescription,
} from "@/components/ui/morphing-dialog";
import "highlight.js/styles/github-dark.css";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3008';

export interface DesignDocViewerProps {
  /** Path to design doc (e.g., ".designs/{EPIC_ID}.md") */
  designDocPath: string;
  /** Epic ID for display */
  epicId: string;
  /** Project root path (absolute) */
  projectPath: string;
  /** Callback when fullscreen state changes */
  onFullScreenChange?: (isFullScreen: boolean) => void;
  /** Whether the dialog should start in open state */
  defaultOpen?: boolean;
}

/**
 * Fetch design doc content from API
 */
async function fetchDesignDoc(path: string, projectPath: string): Promise<string> {
  const encodedPath = encodeURIComponent(path);
  const encodedProjectPath = encodeURIComponent(projectPath);
  const response = await fetch(
    `${API_BASE}/api/fs/read?path=${encodedPath}&project_path=${encodedProjectPath}`
  );
  if (!response.ok) {
    throw new Error('Failed to fetch design doc: ' + response.statusText);
  }
  const data = await response.json();
  return data.content || '';
}

/** Prose styles for markdown rendering */
const proseStyles = cn(
  "prose prose-sm dark:prose-invert max-w-none",
  "prose-headings:scroll-mt-20",
  "prose-pre:bg-zinc-900 prose-pre:text-zinc-100",
  "prose-code:text-sm prose-code:bg-zinc-100 dark:prose-code:bg-zinc-800",
  "prose-code:px-1 prose-code:py-0.5 prose-code:rounded"
);

/**
 * Custom hook to enable mouse wheel scrolling on an element when
 * a parent scroll lock (like Radix Dialog) is intercepting wheel events.
 *
 * This is needed because when the MorphingDialog opens on top of the Sheet,
 * the Sheet's scroll lock from @radix-ui/react-dialog intercepts all wheel
 * events. This hook manually handles scrolling and stops propagation.
 *
 * Returns a callback ref that should be passed to the scrollable element.
 */
function useWheelScrollRef() {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const handlerRef = useRef<((e: WheelEvent) => void) | null>(null);

  const callbackRef = useCallback((element: HTMLDivElement | null) => {
    // Clean up previous listener if any
    if (elementRef.current && handlerRef.current) {
      elementRef.current.removeEventListener('wheel', handlerRef.current);
    }

    elementRef.current = element;

    if (element) {
      const handleWheel = (e: WheelEvent) => {
        const el = e.currentTarget as HTMLElement;
        const canScrollUp = el.scrollTop > 0;
        const canScrollDown = el.scrollTop < el.scrollHeight - el.clientHeight;

        // Only intercept if we can scroll in the direction of the wheel
        if ((e.deltaY < 0 && canScrollUp) || (e.deltaY > 0 && canScrollDown)) {
          e.preventDefault();
          e.stopPropagation();
          el.scrollTop += e.deltaY;
        }
      };

      handlerRef.current = handleWheel;
      element.addEventListener('wheel', handleWheel, { passive: false });
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (elementRef.current && handlerRef.current) {
        elementRef.current.removeEventListener('wheel', handlerRef.current);
      }
    };
  }, []);

  return callbackRef;
}

/**
 * Markdown renderer for design docs with syntax highlighting
 * Uses MorphingDialog for smooth expand/collapse animation
 */
export function DesignDocViewer({ designDocPath, epicId, projectPath, onFullScreenChange, defaultOpen }: DesignDocViewerProps) {
  const [content, setContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Enable wheel scrolling that bypasses Radix's scroll lock
  // Uses callback ref to attach listener when element mounts
  const scrollableRef = useWheelScrollRef();

  const handleOpenChange = useCallback((isOpen: boolean) => {
    onFullScreenChange?.(isOpen);
  }, [onFullScreenChange]);

  useEffect(() => {
    const loadDoc = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const docContent = await fetchDesignDoc(designDocPath, projectPath);
        setContent(docContent);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load design doc");
      } finally {
        setIsLoading(false);
      }
    };

    loadDoc();
  }, [designDocPath, projectPath]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            <span className="text-sm">Loading design document…</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-sm text-destructive">
            <p className="font-semibold">Error loading design document</p>
            <p className="text-xs mt-1">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Extract first heading or first line as preview
  const firstLine = content.split('\n').find(line => line.trim()) || 'Design Document';
  const previewText = firstLine.replace(/^#+\s*/, '').slice(0, 100);

  return (
    <MorphingDialog
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 24,
      }}
      onOpenChange={handleOpenChange}
      defaultOpen={defaultOpen}
    >
      <MorphingDialogTrigger className="w-full text-left">
        <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-muted-foreground" aria-hidden="true" />
              <MorphingDialogTitle>
                <CardTitle className="text-sm font-semibold">Design Document</CardTitle>
              </MorphingDialogTitle>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {epicId}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0 pb-4">
            <MorphingDialogDescription
              disableLayoutAnimation
              variants={{
                initial: { opacity: 1 },
                animate: { opacity: 1 },
                exit: { opacity: 0 },
              }}
            >
              <p className="text-xs text-muted-foreground line-clamp-2">
                {previewText}
              </p>
            </MorphingDialogDescription>
          </CardContent>
        </Card>
      </MorphingDialogTrigger>

      <MorphingDialogContainer>
        <MorphingDialogContent
          className="relative bg-background border rounded-lg shadow-lg w-[60vw] max-h-[80vh] flex flex-col overflow-hidden"
        >
          <div ref={scrollableRef} className="p-6 overflow-y-auto flex-1 min-h-0 overscroll-contain">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="size-4 text-muted-foreground" aria-hidden="true" />
              <MorphingDialogTitle>
                <h2 className="text-sm font-semibold">Design Document</h2>
              </MorphingDialogTitle>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {epicId}
              </Badge>
            </div>
            <MorphingDialogDescription
              disableLayoutAnimation
              variants={{
                initial: { opacity: 0, scale: 0.98 },
                animate: { opacity: 1, scale: 1 },
                exit: { opacity: 0, scale: 0.98 },
              }}
              className={proseStyles}
            >
              <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                {content}
              </ReactMarkdown>
            </MorphingDialogDescription>
          </div>
          <MorphingDialogClose className="absolute top-4 right-4" />
        </MorphingDialogContent>
      </MorphingDialogContainer>
    </MorphingDialog>
  );
}
