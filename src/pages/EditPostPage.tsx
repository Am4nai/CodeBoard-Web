import React, { useEffect, useState } from "react";
import { api } from "../api/axiosInstance";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

type Language = {
  id: number;
  name: string;
  created_at?: string;
};

type PostByIdResponse = {
  id: number;
  author_id: number;
  author_name: string;
  author_avatar_url: string | null;
  title: string;
  description: string | null;
  about: string | null;
  code: string;
  language_id: number;
  language_name: string;
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
};

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
    </main>
  );
};

export default EditPostPage;
