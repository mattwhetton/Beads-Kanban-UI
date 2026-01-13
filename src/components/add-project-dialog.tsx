"use client";

import { useState } from "react";
import * as api from "@/lib/api";
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
  const [isValidating, setIsValidating] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);
  const [pathError, setPathError] = useState<string | null>(null);
  const { toast } = useToast();

  const validatePath = async (path: string): Promise<boolean> => {
    if (!path.trim()) {
      setPathError("Please enter a project path");
      return false;
    }

    setIsValidating(true);
    setPathError(null);

    try {
      const beadsFolderPath = `${path.replace(/\/+$/, "")}/.beads`;
      const result = await api.fs.exists(beadsFolderPath);

      if (!result.exists) {
        setPathError("No .beads folder found. Run `bd init` in your project first.");
        toast({
          title: "No .beads folder found",
          description: "Run `bd init` in your project first.",
          variant: "destructive",
        });
        return false;
      }

      return true;
    } catch (err) {
      console.error("Error validating path:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setPathError(errorMessage || "Failed to validate path");
      toast({
        title: "Error",
        description: errorMessage || "Failed to validate path. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const handleValidateAndProceed = async () => {
    const isValid = await validatePath(projectPath);

    if (isValid) {
      // Extract folder name as default project name
      const cleanPath = projectPath.replace(/\/+$/, "");
      const pathParts = cleanPath.split(/[/\\]/);
      const defaultName = pathParts[pathParts.length - 1] || "Untitled Project";

      setProjectName(defaultName);
      setShowNameInput(true);
    }
  };

  const handlePathBlur = () => {
    if (projectPath.trim()) {
      setPathError(null); // Clear error on blur, will validate on button click
    }
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
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetState();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Project</DialogTitle>
          <DialogDescription>
            {showNameInput
              ? "Give your project a name."
              : "Enter the path to a folder containing a beads project."}
          </DialogDescription>
        </DialogHeader>

        {!showNameInput ? (
          <div className="flex flex-col gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="path" className="text-sm font-medium text-zinc-700">
                Project Path
              </label>
              <Input
                id="path"
                value={projectPath}
                onChange={(e) => {
                  setProjectPath(e.target.value);
                  setPathError(null);
                }}
                onBlur={handlePathBlur}
                placeholder="/path/to/your/project"
                autoFocus
                className={pathError ? "border-red-500" : ""}
              />
              {pathError && (
                <p className="text-sm text-red-500">{pathError}</p>
              )}
              <p className="text-xs text-zinc-500">
                The folder must contain a <code className="rounded bg-zinc-100 px-1 py-0.5">.beads</code> directory
              </p>
            </div>
            <DialogFooter>
              <Button
                onClick={handleValidateAndProceed}
                disabled={isValidating || !projectPath.trim()}
              >
                {isValidating ? "Validating..." : "Validate & Continue"}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-zinc-700">
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
                <label className="text-sm font-medium text-zinc-700">Location</label>
                <p className="truncate rounded-md bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
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
                {isSubmitting ? "Adding..." : "Add Project"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
