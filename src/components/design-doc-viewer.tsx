"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Maximize2, Minimize2, FileText, Loader2 } from "lucide-react";
import "highlight.js/styles/github-dark.css";

export interface DesignDocViewerProps {
  /** Path to design doc (e.g., ".designs/{EPIC_ID}.md") */
  designDocPath: string;
  /** Epic ID for display */
  epicId: string;
}

/**
 * Fetch design doc content from API
 */
async function fetchDesignDoc(path: string): Promise<string> {
  const encodedPath = encodeURIComponent(path);
  const response = await fetch('/api/fs/read?path=' + encodedPath);
  if (!response.ok) {
    throw new Error('Failed to fetch design doc: ' + response.statusText);
  }
  const data = await response.json();
  return data.content || '';
}

/**
 * Markdown renderer for design docs with syntax highlighting
 */
export function DesignDocViewer({ designDocPath, epicId }: DesignDocViewerProps) {
  const [content, setContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    const loadDoc = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const docContent = await fetchDesignDoc(designDocPath);
        setContent(docContent);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load design doc");
      } finally {
        setIsLoading(false);
      }
    };

    loadDoc();
  }, [designDocPath]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading design document...</span>
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

  return (
    <Card
      className={cn(
        "transition-all",
        isFullScreen && "fixed inset-4 z-50 overflow-auto"
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-semibold">Design Document</CardTitle>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {epicId}
          </Badge>
        </div>
        <button
          onClick={() => setIsFullScreen(!isFullScreen)}
          className="p-1 rounded-md hover:bg-accent transition-colors"
          aria-label={isFullScreen ? "Exit full screen" : "Enter full screen"}
        >
          {isFullScreen ? (
            <Minimize2 className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Maximize2 className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </CardHeader>
      <CardContent className={cn(
        "prose prose-sm dark:prose-invert max-w-none",
        "prose-headings:scroll-mt-20",
        "prose-pre:bg-zinc-900 prose-pre:text-zinc-100",
        "prose-code:text-sm prose-code:bg-zinc-100 dark:prose-code:bg-zinc-800",
        "prose-code:px-1 prose-code:py-0.5 prose-code:rounded",
        isFullScreen ? "p-8 max-h-[calc(100vh-8rem)] overflow-auto" : "p-6"
      )}>
        <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
          {content}
        </ReactMarkdown>
      </CardContent>
    </Card>
  );
}
