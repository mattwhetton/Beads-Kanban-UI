"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getTags, createTag, deleteTag, type Tag } from "@/lib/db";
import { ColorPicker } from "@/components/color-picker";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SettingsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#3b82f6");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTags() {
      try {
        const loadedTags = await getTags();
        setTags(loadedTags);
      } catch (error) {
        console.error("Failed to load tags:", error);
      }
      setIsLoading(false);
    }
    loadTags();
  }, []);

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    try {
      const tag = await createTag({ name: newTagName.trim(), color: newTagColor });
      setTags((prev) => [...prev, tag]);
      setNewTagName("");
      setNewTagColor("#3b82f6");
      setIsAddingTag(false);
    } catch (error) {
      console.error("Failed to create tag:", error);
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    try {
      await deleteTag(tagId);
      setTags((prev) => prev.filter((t) => t.id !== tagId));
    } catch (error) {
      console.error("Failed to delete tag:", error);
    }
  };

  return (
    <div className="dark min-h-dvh bg-[#0a0a0a]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-zinc-800 bg-[#0a0a0a]/80 backdrop-blur-sm px-6 py-4">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            aria-label="Go back to home"
            className="rounded-md p-2 text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
          </Link>
          <h1 className="text-xl font-semibold text-white">Settings</h1>
        </div>
      </header>

      {/* Settings Content */}
      <main className="mx-auto max-w-2xl p-6">
        {/* Tags Section */}
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-medium text-zinc-100">Tags</h2>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <p className="text-sm text-zinc-400">
              Manage your project tags here. Tags help organize and categorize your projects.
            </p>

            {/* Tags List */}
            <div className="mt-4 space-y-2">
              {isLoading ? (
                <p className="text-sm text-zinc-400">Loading tags…</p>
              ) : tags.length === 0 && !isAddingTag ? (
                <p className="text-sm text-zinc-400">No tags yet. Create one to get started.</p>
              ) : (
                tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-800/50 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="size-4 rounded-full"
                        style={{ backgroundColor: tag.color }}
                        aria-hidden="true"
                      />
                      <span className="text-sm font-medium text-zinc-200">{tag.name}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteTag(tag.id)}
                      className="rounded p-1 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]"
                      title="Delete tag"
                      aria-label={`Delete tag ${tag.name}`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        <line x1="10" x2="10" y1="11" y2="17" />
                        <line x1="14" x2="14" y1="11" y2="17" />
                      </svg>
                    </button>
                  </div>
                ))
              )}

              {/* Add Tag Form */}
              {isAddingTag && (
                <div className="mt-3 space-y-3 rounded-md border border-zinc-800 bg-zinc-900/70 p-3">
                  <div className="flex items-center gap-2">
                    <ColorPicker value={newTagColor} onChange={setNewTagColor} />
                    <Input
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      placeholder="Tag name…"
                      aria-label="Tag name"
                      className="flex-1 border-zinc-700 bg-zinc-800 text-zinc-100 placeholder:text-zinc-500"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleCreateTag();
                        } else if (e.key === "Escape") {
                          setIsAddingTag(false);
                          setNewTagName("");
                          setNewTagColor("#3b82f6");
                        }
                      }}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-zinc-700 bg-transparent text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                      onClick={() => {
                        setIsAddingTag(false);
                        setNewTagName("");
                        setNewTagColor("#3b82f6");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="bg-zinc-100 text-zinc-900 hover:bg-white"
                      onClick={handleCreateTag}
                      disabled={!newTagName.trim()}
                    >
                      Create Tag
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Add Tag Button */}
            {!isAddingTag && (
              <div className="mt-4">
                <button
                  onClick={() => setIsAddingTag(true)}
                  className="rounded-md bg-zinc-100 px-3 py-1.5 text-sm text-zinc-900 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]"
                >
                  Add Tag
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Theme Section */}
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-medium text-zinc-100">Theme</h2>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-zinc-100">Appearance</p>
                <p className="text-sm text-zinc-400">Choose your preferred theme</p>
              </div>
              <Select defaultValue="light">
                <SelectTrigger className="w-[140px] border-zinc-700 bg-zinc-800 text-zinc-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-zinc-700 bg-zinc-800">
                  <SelectItem value="light" className="text-zinc-100 focus:bg-zinc-700 focus:text-zinc-100">
                    Light
                  </SelectItem>
                  <SelectItem value="dark" disabled className="text-zinc-400">
                    Dark (coming soon)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Data Section */}
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-medium text-zinc-100">Data</h2>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-zinc-100">Export Settings</p>
                  <p className="text-sm text-zinc-400">Download your settings as JSON</p>
                </div>
                <button className="rounded-md border border-zinc-700 px-3 py-1.5 text-sm text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]">
                  Export
                </button>
              </div>
              <div className="border-t border-zinc-800 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-red-400">Clear Local Database</p>
                    <p className="text-sm text-zinc-400">
                      Remove all projects and tags from local storage
                    </p>
                  </div>
                  <button className="rounded-md border border-red-800/50 bg-red-900/30 px-3 py-1.5 text-sm text-red-400 hover:bg-red-900/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]">
                    Clear Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
