import React, { useEffect, useState } from "react";
import { api } from "../api/axiosInstance";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import type { Language } from "../types/interfaces";
import type { Tag } from "../types/interfaces";
import type { PostByIdResponse } from "../types/interfaces";

const EditPostPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const postId = Number(id);

  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [about, setAbout] = useState("");
  const [code, setCode] = useState("");

  const [languages, setLanguages] = useState<Language[]>([]);
  const [languageId, setLanguageId] = useState<number | "">("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // tags
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [foundTags, setFoundTags] = useState<Tag[]>([]);
  const [tagSearch, setTagSearch] = useState("");
  const [newTagInput, setNewTagInput] = useState("");
  const [isTagsModalOpen, setIsTagsModalOpen] = useState(false);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [createTagLoading, setCreateTagLoading] = useState(false);
  const [tagsError, setTagsError] = useState("");

  const loadLanguages = async () => {
    try {
      const res = await api.get<Language[]>("/languages");
      setLanguages(res.data);
    } catch {
      setLanguages([]);
    }
  };

  const fetchPost = async () => {
    if (!Number.isFinite(postId)) {
      setError("Invalid post id.");
      setLoading(false);
      return;
    }

    try {
      setError("");
      setLoading(true);

      const postRes = await api.get<PostByIdResponse>(`/posts/${postId}`);
      const p = postRes.data;

      setTitle(p.title);
      setCode(p.code);
      setDescription(p.description ?? "");
      setAbout(p.about ?? "");
      setLanguageId(p.language_id);
      setSelectedTags((p.tags ?? []).map((tag, index) => ({
        id: -(index + 1),
        name: tag,
        posts_count: 0,
      })));

      setLoading(false);
    } catch (err) {
      console.log(err);
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const apiError = (err.response?.data as { error?: string } | undefined)?.error;

        if (status === 404) setError("Post not found.");
        else setError(apiError || "Failed to load post. Please try again.");
      } else {
        setError("Failed to load post. Please try again.");
      }
      setLoading(false);
    }
  };

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
            (tag) =>
              !selectedTags.some(
                (selected) => selected.name.toLowerCase() === tag.name.toLowerCase()
              )
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
              (tag) =>
                !selectedTags.some(
                  (selected) => selected.name.toLowerCase() === tag.name.toLowerCase()
                )
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
            (tag) =>
              !selectedTags.some(
                (selected) => selected.name.toLowerCase() === tag.name.toLowerCase()
              )
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

  const addExistingTag = (tag: Tag) => {
    const alreadySelected = selectedTags.some(
      (selected) => selected.name.toLowerCase() === tag.name.toLowerCase()
    );
    if (alreadySelected) return;

    setSelectedTags((prev) => [...prev, tag]);
    setFoundTags((prev) => prev.filter((item) => item.id !== tag.id));
  };

  const removeSelectedTag = (tagName: string) => {
    setSelectedTags((prev) => prev.filter((tag) => tag.name !== tagName));
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

  const postUpdate = async () => {
    if (!Number.isFinite(postId)) return;

    const cleanTitle = title.trim();
    const cleanCode = code.trim();

    if (!cleanTitle || !cleanCode || languageId === "") {
      setError("Please fill in title, code, and select a language.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await api.put(`/posts/${postId}`, {
        title: cleanTitle,
        code,
        language_id: Number(languageId),
        description: description.trim() || null,
        about: about.trim() || null,
        tags: selectedTags.map((tag) => tag.name),
      });

      if (user?.id) navigate(`/profile/${user.id}`);
      else navigate("/");
    } catch (err) {
      console.log(err);
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const apiError = (err.response?.data as { error?: string } | undefined)?.error;

        if (status === 401) setError("You need to log in to edit a post.");
        else if (status === 403) setError("You can't edit someone else's post.");
        else setError(apiError || "Failed to update post. Please try again.");
      } else {
        setError("Failed to update post. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  const postDelete = async () => {
    if (!Number.isFinite(postId)) return;

    const ok = window.confirm("Delete this post? This action cannot be undone.");
    if (!ok) return;

    try {
      setSaving(true);
      setError("");

      await api.delete(`/posts/${postId}`);

      if (user?.id) navigate(`/profile/${user.id}`);
      else navigate("/");
    } catch (err) {
      console.log(err);
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const apiError = (err.response?.data as { error?: string } | undefined)?.error;

        if (status === 401) setError("You need to log in to delete a post.");
        else if (status === 403) setError("You can't delete someone else's post.");
        else setError(apiError || "Failed to delete post. Please try again.");
      } else {
        setError("Failed to delete post. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadLanguages();
    fetchPost();
  }, [id]);

  return (
    <main className="p-4 sm:p-6 text-text">
      <div className="max-w-7xl mx-auto">
        <section className="mb-6 flex flex-col gap-2 animate-fade-up">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit post</h1>
            <p className="text-text-secondary">
              Update your post details or delete it permanently.
            </p>
          </div>

          {error && (
            <div className="rounded-lg bg-error/10 border border-error/30 px-3 py-2">
              <p className="text-error text-sm">{error}</p>
            </div>
          )}
        </section>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 animate-fade-up">
          <section className="flex flex-col w-full lg:flex-2 rounded-2xl bg-surface shadow-3xl p-4">
            <label className="text-sm text-text-secondary mb-1">Title</label>
            <input
              placeholder="Title..."
              className="rounded-lg px-4 py-3 bg-surface-lite focus:bg-surface-lite-focus focus:outline-none transition-colors duration-200"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading || saving}
            />

            <div className="flex items-center justify-between mt-4 mb-2">
              <label className="text-sm text-text-secondary">Code</label>
              <span className="text-xs text-text-secondary">
                {loading ? "Loading..." : saving ? "Saving..." : ""}
              </span>
            </div>

            <textarea
              className="rounded-xl px-4 py-3 bg-surface-lite focus:bg-surface-lite-focus focus:outline-none transition-colors duration-200 resize-none
                         h-[55vh] sm:h-[65vh] lg:h-[calc(80vh-10rem)]"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={loading || saving}
            />
          </section>

          <section className="flex flex-col w-full lg:flex-1 rounded-2xl bg-surface glow-hover shadow-3xl p-4">
            <label className="text-sm text-text-secondary mb-1">Language</label>

            {languages.length > 0 ? (
              <select
                className="rounded-lg px-4 py-3 bg-surface-lite focus:bg-surface-lite-focus focus:outline-none transition-colors duration-200"
                value={languageId}
                onChange={(e) => setLanguageId(e.target.value ? Number(e.target.value) : "")}
                disabled={loading || saving}
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
                placeholder="language_id (number)..."
                className="rounded-lg px-4 py-3 bg-surface-lite focus:bg-surface-lite-focus focus:outline-none transition-colors duration-200"
                value={languageId}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  setLanguageId(v === "" ? "" : Number(v));
                }}
                disabled={loading || saving}
              />
            )}

            <div className="mt-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm text-text-secondary">Tags</label>
                <button
                  type="button"
                  onClick={() => setIsTagsModalOpen(true)}
                  disabled={loading || saving}
                  className="rounded-lg px-3 py-2 bg-secondary hover:bg-secondary-hover transition-colors duration-200 text-sm disabled:opacity-70"
                >
                  Manage tags
                </button>
              </div>

              <div className="rounded-lg bg-surface-lite px-3 py-3 min-h-[60px] flex flex-wrap gap-2">
                {selectedTags.length > 0 ? (
                  selectedTags.map((tag) => (
                    <span
                      key={`${tag.id}-${tag.name}`}
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

            <label className="text-sm text-text-secondary mb-1 mt-4">Description</label>
            <textarea
              className="rounded-xl px-4 py-3 bg-surface-lite focus:bg-surface-lite-focus focus:outline-none transition-colors duration-200 resize-none h-32"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading || saving}
            />

            <label className="text-sm text-text-secondary mb-1 mt-4">About</label>
            <textarea
              className="h-full rounded-xl px-4 py-3 bg-surface-lite focus:bg-surface-lite-focus focus:outline-none transition-colors duration-200 resize-none"
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              disabled={loading || saving}
            />

            <div className="mt-5 flex flex-col gap-3">
              <button
                type="button"
                className="bg-secondary hover:bg-secondary-hover transition-all duration-200 rounded-lg p-4 text-text-buttons
                           disabled:opacity-70 hover:-translate-y-0.5 active:translate-y-0"
                disabled={loading || saving}
                onClick={postUpdate}
              >
                {saving ? "Saving..." : "Update"}
              </button>

              <button
                type="button"
                className="bg-primary hover:bg-primary-hover transition-all duration-200 rounded-lg p-4 text-text-buttons
                           disabled:opacity-70 hover:-translate-y-0.5 active:translate-y-0"
                disabled={loading || saving}
                onClick={postDelete}
              >
                Delete
              </button>
            </div>
          </section>
        </div>
      </div>

      {isTagsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 px-4 py-6 overflow-y-auto">
          <div className="min-h-full flex items-center justify-center">
            <div className="w-full max-w-2xl rounded-2xl bg-surface shadow-3xl p-5 flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Manage tags</h2>
                <button
                  type="button"
                  onClick={closeTagsModal}
                  className="rounded-lg px-3 py-2 bg-secondary hover:bg-secondary-hover transition-colors duration-200"
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
                <div className="rounded-xl bg-surface-lite p-3 min-h-[48px] flex flex-wrap gap-2">
                  {selectedTags.length > 0 ? (
                    selectedTags.map((tag) => (
                      <div
                        key={`${tag.id}-${tag.name}`}
                        className="inline-flex items-center gap-2 rounded-full bg-primary/15 border border-primary/30 px-3 py-1.5 text-sm"
                      >
                        <span>#{tag.name}</span>
                        <button
                          type="button"
                          onClick={() => removeSelectedTag(tag.name)}
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
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default EditPostPage;