"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { FolderBrowser } from "@/components/folder-browser";
import type { CreateProjectInput } from "@/lib/db";

interface AddProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddProject: (input: CreateProjectInput) => Promise<void>;
}

export function AddProjectDialog({
  open: isOpen,
  onOpenChange,
  onAddProject,
}: AddProjectDialogProps) {
  const [projectPath, setProjectPath] = useState<string>("");
  const [projectName, setProjectName] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);
  const [pathError, setPathError] = useState<string | null>(null);
  const [browserPath, setBrowserPath] = useState<string>("/Users");
  const { toast } = useToast();

  const handleSelectPath = (path: string, hasBeads: boolean) => {
    if (!hasBeads) {
      setPathError("No .beads folder found. Run `bd init` in your project first.");
      toast({
        title: "No .beads folder found",
        description: "Run `bd init` in your project first.",
        variant: "destructive",
      });
      return;
    }

    // Extract folder name as default project name
    const cleanPath = path.replace(/\/+$/, "");
    const pathParts = cleanPath.split(/[/\\]/);
    const defaultName = pathParts[pathParts.length - 1] || "Untitled Project";

    setProjectPath(cleanPath);
    setProjectName(defaultName);
    setPathError(null);
    setShowNameInput(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectPath || !projectName.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onAddProject({
        name: projectName.trim(),
        path: projectPath.replace(/\/+$/, ""),
      });

      toast({
        title: "Project added",
        description: `"${projectName}" has been added successfully.`,
      });

      // Reset state and close dialog
      resetState();
      onOpenChange(false);
    } catch (err) {
      console.error("Error adding project:", err);
      toast({
        title: "Error",
        description: "Failed to add project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetState = () => {
    setProjectPath("");
    setProjectName("");
    setShowNameInput(false);
    setPathError(null);
    setBrowserPath("/Users");
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetState();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Project</DialogTitle>
          <DialogDescription>
            {showNameInput
              ? "Give your project a name."
              : "Browse to a folder containing a beads project."}
          </DialogDescription>
        </DialogHeader>

        {!showNameInput ? (
          <div className="flex flex-col gap-4 py-4">
            <FolderBrowser
              currentPath={browserPath}
              onPathChange={setBrowserPath}
              onSelectPath={handleSelectPath}
            />
            {pathError && (
              <p className="text-sm text-red-400">{pathError}</p>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-zinc-300">
                  Project Name
                </label>
                <Input
                  id="name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="My Project"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Location</label>
                <p className="truncate rounded-md bg-zinc-800 px-3 py-2 text-sm text-zinc-400">
                  {projectPath}
                </p>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNameInput(false)}
              >
                Back
              </Button>
              <Button type="submit" disabled={isSubmitting || !projectName.trim()}>
                {isSubmitting ? "Adding\u2026" : "Add Project"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
