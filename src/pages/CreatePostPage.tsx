import React, { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api/axiosInstance";
import axios from "axios";

type Language = {
  id: number;
  name: string;
};

type Tag = {
  id: number;
  name: string;
  posts_count: number;
};

const CreatePostPage: React.FC = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [about, setAbout] = useState("");
  const [code, setCode] = useState("");

  const [languages, setLanguages] = useState<Language[]>([]);
  const [languageId, setLanguageId] = useState<number | "">("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [foundTags, setFoundTags] = useState<Tag[]>([]);
  const [tagSearch, setTagSearch] = useState("");
  const [newTagInput, setNewTagInput] = useState("");
  const [isTagsModalOpen, setIsTagsModalOpen] = useState(false);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [createTagLoading, setCreateTagLoading] = useState(false);
  const [tagsError, setTagsError] = useState("");

  const codeTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const lineNumbersRef = useRef<HTMLDivElement | null>(null);

  const hasLanguages = languages.length > 0;

  useEffect(() => {
    const loadLanguages = async () => {
      try {
        const res = await api.get<Language[]>("/languages");
        setLanguages(res.data);
      } catch {
      }
    };

    loadLanguages();
  }, []);

  useEffect(() => {
    if (!isTagsModalOpen) return;

    const loadAllTags = async () => {
      try {
        setTagsLoading(true);
        setTagsError("");

        const res = await api.get<Tag[]>("/tags");

        setAllTags(res.data);
        setFoundTags(
          res.data.filter(
            (tag) => !selectedTags.some((selected) => selected.id === tag.id)
          )
        );
      } catch (err) {
        if (axios.isAxiosError(err)) {
          const apiError = (err.response?.data as { error?: string } | undefined)?.error;
          setTagsError(apiError || "Failed to load tags.");
        } else {
          setTagsError("Failed to load tags.");
        }
      } finally {
        setTagsLoading(false);
      }
    };

    loadAllTags();
  }, [isTagsModalOpen, selectedTags]);

  useEffect(() => {
    if (!isTagsModalOpen) return;

    const timer = setTimeout(async () => {
      const query = tagSearch.trim();

      try {
        setTagsLoading(true);
        setTagsError("");

        if (!query) {
          setFoundTags(
            allTags.filter(
              (tag) => !selectedTags.some((selected) => selected.id === tag.id)
            )
          );
          return;
        }

        const res = await api.get<Tag[]>("/tags/search", {
          params: {
            q: query,
            limit: 10,
          },
        });

        setFoundTags(
          res.data.filter(
            (tag) => !selectedTags.some((selected) => selected.id === tag.id)
          )
        );
      } catch (err) {
        if (axios.isAxiosError(err)) {
          const apiError = (err.response?.data as { error?: string } | undefined)?.error;
          setTagsError(apiError || "Failed to search tags.");
        } else {
          setTagsError("Failed to search tags.");
        }
      } finally {
        setTagsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [tagSearch, isTagsModalOpen, allTags, selectedTags]);

  const isDisabled = useMemo(() => {
    return (
      loading ||
      !title.trim() ||
      !description.trim() ||
      !code.trim() ||
      languageId === ""
    );
  }, [loading, title, description, code, languageId]);

  const lineCount = useMemo(() => {
    return Math.max(1, code.split("\n").length);
  }, [code]);

  const lineNumbers = useMemo(() => {
    return Array.from({ length: lineCount }, (_, i) => i + 1);
  }, [lineCount]);

  const syncScroll = () => {
    if (!codeTextareaRef.current || !lineNumbersRef.current) return;
    lineNumbersRef.current.scrollTop = codeTextareaRef.current.scrollTop;
  };

  const addExistingTag = (tag: Tag) => {
    if (selectedTags.some((selected) => selected.id === tag.id)) return;

    setSelectedTags((prev) => [...prev, tag]);
    setFoundTags((prev) => prev.filter((item) => item.id !== tag.id));
  };

  const removeSelectedTag = (tagId: number) => {
    setSelectedTags((prev) => prev.filter((tag) => tag.id !== tagId));
  };

  const createNewTag = async () => {
    const normalized = newTagInput.trim().replace(/^#/, "").toLowerCase();

    if (!normalized) return;

    const existsInSelected = selectedTags.some(
      (tag) => tag.name.toLowerCase() === normalized
    );
    if (existsInSelected) {
      setNewTagInput("");
      return;
    }

    try {
      setCreateTagLoading(true);
      setTagsError("");

      const res = await api.post<Tag>("/tags", {
        name: normalized,
      });

      const createdTag = res.data;

      setSelectedTags((prev) => [...prev, createdTag]);
      setAllTags((prev) => {
        const alreadyExists = prev.some((tag) => tag.id === createdTag.id);
        if (alreadyExists) return prev;
        return [...prev, createdTag].sort((a, b) => a.name.localeCompare(b.name));
      });
      setFoundTags((prev) => prev.filter((tag) => tag.id !== createdTag.id));
      setNewTagInput("");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const apiError = (err.response?.data as { error?: string } | undefined)?.error;

        if (status === 409) {
          setTagsError("This tag already exists. Try searching for it.");
          return;
        }

        if (status === 400) {
          setTagsError(apiError || "Tag name is required.");
          return;
        }

        setTagsError(apiError || "Failed to create tag.");
        return;
      }

      setTagsError("Failed to create tag.");
    } finally {
      setCreateTagLoading(false);
    }
  };

  const closeTagsModal = () => {
    setIsTagsModalOpen(false);
    setTagSearch("");
    setNewTagInput("");
    setTagsError("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!title.trim() || !description.trim() || !code.trim() || languageId === "") {
      setError("Please fill in title, description, code, and select a language.");
      return;
    }

    try {
      setLoading(true);

      await api.post("/posts", {
        title: title.trim(),
        code,
        language_id: Number(languageId),
        description: description.trim(),
        about: about.trim() || null,
        tags: selectedTags.map((tag) => tag.name),
      });

      alert("Post created.");

      setTitle("");
      setDescription("");
      setAbout("");
      setCode("");
      setLanguageId("");
      setSelectedTags([]);
      setTagSearch("");
      setNewTagInput("");
      setTagsError("");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const apiError = (err.response?.data as { error?: string } | undefined)?.error;

        if (status === 401) {
          setError("You need to be logged in to create a post.");
          return;
        }

        if (status === 400) {
          setError(apiError || "Please check your input.");
          return;
        }

        setError(apiError || "Server error. Please try again later.");
        return;
      }

      setError("Unknown error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-8rem)] bg-bg text-text px-4 sm:px-6 py-6">
      <section className="max-w-[1400px] mx-auto mb-6 animate-fade-up">
        <h1 className="text-3xl font-bold tracking-tight">Create post</h1>
        <p className="text-text-secondary mt-1">
          Share your code snippet with a title, language, tags, and a short description.
        </p>

        {error && (
          <div className="mt-5 rounded-lg bg-error/10 border border-error/30 px-3 py-2">
            <p className="text-error text-sm">{error}</p>
          </div>
        )}
      </section>

      <form onSubmit={handleSubmit} className="max-w-[1400px] mx-auto flex flex-col gap-6 animate-fade-up">
        <section className="rounded-2xl bg-surface shadow-3xl p-4 sm:p-5">
          <label className="text-text-secondary text-sm">Title</label>
          <input
            placeholder="e.g. Binary search in TypeScript"
            className="mt-2 w-full rounded-lg px-3 py-3 bg-surface-lite focus:outline-none focus:bg-surface-lite-focus transition-colors duration-200 ease-in-out"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError("");
            }}
          />
        </section>

        <section className="rounded-2xl bg-surface shadow-3xl p-4 sm:p-5 flex flex-col min-h-0">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Code</h2>
            <span className="text-xs text-text-secondary">
              {code.length.toLocaleString()} chars
            </span>
          </div>

          <div className="mt-4 rounded-xl overflow-hidden bg-surface-lite border border-surface-lite-focus">
            <div className="flex min-h-[55vh] lg:min-h-[65vh]">
              <div
                ref={lineNumbersRef}
                className="w-14 shrink-0 overflow-hidden border-r border-surface-lite-focus bg-surface-focus px-2 py-3 text-right text-sm leading-6 text-text-secondary select-none"
              >
                {lineNumbers.map((line) => (
                  <div key={line} className="h-6">
                    {line}
                  </div>
                ))}
              </div>

              <textarea
                ref={codeTextareaRef}
                className="w-full resize-none bg-surface-lite px-4 py-3 font-mono text-sm leading-6 text-text focus:outline-none"
                placeholder={`Paste your code here...\n\nTip: use clear formatting for readability.`}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (error) setError("");
                }}
                onScroll={syncScroll}
                spellCheck={false}
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-surface shadow-3xl glow-hover p-4 sm:p-5">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-text-secondary text-sm">Language</label>

                {hasLanguages ? (
                  <select
                    className="rounded-lg px-3 py-3 bg-surface-lite focus:outline-none focus:bg-surface-lite-focus transition-colors duration-200 ease-in-out"
                    value={languageId}
                    onChange={(e) => {
                      const v = e.target.value;
                      setLanguageId(v ? Number(v) : "");
                      if (error) setError("");
                    }}
                  >
                    <option value="">Select language...</option>
                    {languages.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    placeholder="language_id (number)"
                    className="rounded-lg px-3 py-3 bg-surface-lite focus:outline-none focus:bg-surface-lite-focus transition-colors duration-200 ease-in-out"
                    value={languageId}
                    onChange={(e) => {
                      const v = e.target.value.trim();
                      setLanguageId(v === "" ? "" : Number(v));
                      if (error) setError("");
                    }}
                  />
                )}

                {!hasLanguages && (
                  <p className="text-xs text-text-secondary">
                    Languages list is unavailable — enter a numeric <span className="text-text">language_id</span>.
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-text-secondary text-sm">Tags</label>
                  <button
                    type="button"
                    onClick={() => setIsTagsModalOpen(true)}
                    className="rounded-lg px-3 py-2 bg-surface-lite hover:bg-surface-lite-focus transition-colors duration-200 text-sm"
                  >
                    Manage tags
                  </button>
                </div>

                <div className="rounded-lg bg-surface-lite px-3 py-3 min-h-[60px] flex flex-wrap gap-2">
                  {selectedTags.length > 0 ? (
                    selectedTags.map((tag) => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center rounded-full bg-primary/15 border border-primary/30 px-3 py-1 text-sm text-text"
                      >
                        #{tag.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-text-secondary">No tags selected</span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-text-secondary text-sm">Description</label>
                <textarea
                  className="rounded-lg px-3 py-3 bg-surface-lite focus:outline-none focus:bg-surface-lite-focus transition-colors duration-200 ease-in-out resize-none min-h-36"
                  placeholder="Short description (what does this code do?)"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (error) setError("");
                  }}
                />
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={isDisabled}
                  className="flex bg-primary hover:bg-primary-hover rounded-lg px-6 py-3 text-text-buttons transition-all duration-200 ease-in-out disabled:opacity-70 hover:-translate-y-0.5 active:translate-y-0"
                >
                  {loading ? "Creating..." : "Create"}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2 h-full">
                <label className="text-text-secondary text-sm">About</label>
                <textarea
                  className="rounded-lg px-3 py-3 bg-surface-lite focus:outline-none focus:bg-surface-lite-focus transition-colors duration-200 ease-in-out resize-none min-h-[260px] h-full"
                  placeholder="Extra context, usage notes, caveats, etc."
                  value={about}
                  onChange={(e) => {
                    setAbout(e.target.value);
                    if (error) setError("");
                  }}
                />
              </div>
            </div>
          </div>
        </section>
      </form>

      {isTagsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 px-4 py-6 overflow-y-auto">
          <div className="min-h-full flex items-center justify-center">
            <div className="w-full max-w-2xl rounded-2xl bg-surface shadow-3xl p-5 flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Manage tags</h2>
                <button
                  type="button"
                  onClick={closeTagsModal}
                  className="rounded-lg px-3 py-2 bg-surface-lite hover:bg-surface-lite-focus transition-colors duration-200"
                >
                  Close
                </button>
              </div>

              {tagsError && (
                <div className="rounded-lg bg-error/10 border border-error/30 px-3 py-2">
                  <p className="text-error text-sm">{tagsError}</p>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label className="text-text-secondary text-sm">Selected tags</label>
                <div className="rounded-xl bg-surface-lite p-3 min-h-[72px] flex flex-wrap gap-2">
                  {selectedTags.length > 0 ? (
                    selectedTags.map((tag) => (
                      <div
                        key={tag.id}
                        className="inline-flex items-center gap-2 rounded-full bg-primary/15 border border-primary/30 px-3 py-1.5 text-sm"
                      >
                        <span>#{tag.name}</span>
                        <button
                          type="button"
                          onClick={() => removeSelectedTag(tag.id)}
                          className="text-text-secondary hover:text-text transition-colors duration-200"
                        >
                          ×
                        </button>
                      </div>
                    ))
                  ) : (
                    <span className="text-sm text-text-secondary">No tags selected</span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-text-secondary text-sm">Find existing tag</label>
                <input
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  placeholder="Search among existing tags..."
                  className="rounded-lg px-3 py-3 bg-surface-lite focus:outline-none focus:bg-surface-lite-focus transition-colors duration-200"
                />

                <div className="rounded-xl bg-surface-lite p-3 min-h-[140px] flex flex-wrap content-start gap-2">
                  {tagsLoading ? (
                    <span className="text-sm text-text-secondary">Loading tags...</span>
                  ) : foundTags.length > 0 ? (
                    foundTags.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => addExistingTag(tag)}
                        className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm hover:bg-primary/20 transition-colors duration-200"
                        title={`${tag.posts_count} posts`}
                      >
                        + #{tag.name}
                      </button>
                    ))
                  ) : (
                    <span className="text-sm text-text-secondary">
                      Nothing found. You can create a new tag below.
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-text-secondary text-sm">Create new tag</label>
                <div className="flex gap-2">
                  <input
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    placeholder="Enter a new tag..."
                    className="flex-1 rounded-lg px-3 py-3 bg-surface-lite focus:outline-none focus:bg-surface-lite-focus transition-colors duration-200"
                  />
                  <button
                    type="button"
                    onClick={createNewTag}
                    disabled={createTagLoading}
                    className="rounded-lg px-4 py-3 bg-primary hover:bg-primary-hover text-text-buttons transition-colors duration-200 disabled:opacity-70"
                  >
                    {createTagLoading ? "Creating..." : "Create"}
                  </button>
                </div>

                <p className="text-xs text-text-secondary">
                  Create a new tag only if there is no suitable existing tag.
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={closeTagsModal}
                  className="rounded-lg px-4 py-3 bg-primary hover:bg-primary-hover text-text-buttons transition-colors duration-200"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default CreatePostPage;