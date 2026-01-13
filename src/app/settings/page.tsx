"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getTags, createTag, deleteTag, type Tag } from "@/lib/db";
import { ColorPicker } from "@/components/color-picker";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-zinc-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
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
            >
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
          </Link>
          <h1 className="text-xl font-semibold text-zinc-900">Settings</h1>
        </div>
      </header>

      {/* Settings Content */}
      <main className="mx-auto max-w-2xl p-6">
        {/* Tags Section */}
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-medium text-zinc-900">Tags</h2>
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <p className="text-sm text-zinc-500">
              Manage your project tags here. Tags help organize and categorize your projects.
            </p>

            {/* Tags List */}
            <div className="mt-4 space-y-2">
              {isLoading ? (
                <p className="text-sm text-zinc-400">Loading tags...</p>
              ) : tags.length === 0 && !isAddingTag ? (
                <p className="text-sm text-zinc-400">No tags yet. Create one to get started.</p>
              ) : (
                tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between rounded-md border border-zinc-100 bg-zinc-50 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="text-sm font-medium text-zinc-700">{tag.name}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteTag(tag.id)}
                      className="rounded p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600"
                      title="Delete tag"
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
                <div className="mt-3 space-y-3 rounded-md border border-zinc-200 bg-white p-3">
                  <div className="flex items-center gap-2">
                    <ColorPicker value={newTagColor} onChange={setNewTagColor} />
                    <Input
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      placeholder="Tag name"
                      className="flex-1"
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
                      onClick={() => {
                        setIsAddingTag(false);
                        setNewTagName("");
                        setNewTagColor("#3b82f6");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleCreateTag} disabled={!newTagName.trim()}>
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
                  className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white hover:bg-zinc-800"
                >
                  Add Tag
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Theme Section */}
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-medium text-zinc-900">Theme</h2>
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-zinc-900">Appearance</p>
                <p className="text-sm text-zinc-500">Choose your preferred theme</p>
              </div>
              <select
                className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm"
                defaultValue="light"
              >
                <option value="light">Light</option>
                <option value="dark" disabled>
                  Dark (coming soon)
                </option>
              </select>
            </div>
          </div>
        </section>

        {/* Data Section */}
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-medium text-zinc-900">Data</h2>
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-zinc-900">Export Settings</p>
                  <p className="text-sm text-zinc-500">Download your settings as JSON</p>
                </div>
                <button className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50">
                  Export
                </button>
              </div>
              <div className="border-t border-zinc-100 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-red-600">Clear Local Database</p>
                    <p className="text-sm text-zinc-500">
                      Remove all projects and tags from local storage
                    </p>
                  </div>
                  <button className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">
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
