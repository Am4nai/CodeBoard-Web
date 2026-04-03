import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api/axiosInstance";
import axios from "axios";

type Language = {
  id: number;
  name: string;
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

  const isDisabled = useMemo(() => {
    return (
      loading ||
      !title.trim() ||
      !description.trim() ||
      !code.trim() ||
      languageId === ""
    );
  }, [loading, title, description, code, languageId]);

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
      });

      alert("Post created.");

      setTitle("");
      setDescription("");
      setAbout("");
      setCode("");
      setLanguageId("");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const apiError = (err.response?.data as { error?: string } | undefined)?.error;

        if (status === 401) {
          setError("You need to be logged in to create a post.");
          return;
        }

        if (status === 400) {
          setError(apiError || "Please check your input (title, code, and language are required).");
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
    <main className="min-h-[calc(100vh-8rem)] bg-bg text-text px-4 sm:px-6">
      <section className="mx-auto mb-6 animate-fade-up">
        <h1 className="text-3xl font-bold tracking-tight">Create post</h1>
        <p className="text-text-secondary mt-1">
          Share your code snippet with a title, language, and a short description.
        </p>
      </section>

      <div className="mx-auto grid grid-cols-1 lg:grid-cols-5 gap-6 animate-fade-up">
        <section className="lg:col-span-3 rounded-2xl bg-surface shadow-3xl p-4 sm:p-5 flex flex-col gap-3">
          <label className="text-text-secondary text-sm">Title</label>
          <input
            placeholder="e.g. Binary search in TypeScript"
            className="rounded-lg px-3 py-3 bg-surface-lite focus:outline-none focus:bg-surface-lite-focus transition-colors duration-200 ease-in-out"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError("");
            }}
          />

          <div className="flex items-center justify-between mt-2">
            <label className="text-text-secondary text-sm">Code</label>
            <span className="text-xs text-text-secondary">
              {code.length.toLocaleString()} chars
            </span>
          </div>

          <textarea
            className="rounded-lg px-3 py-3 bg-surface-lite focus:outline-none focus:bg-surface-lite-focus transition-colors duration-200 ease-in-out resize-none min-h-[45vh] lg:min-h-[60vh] font-mono text-sm"
            placeholder={`Paste your code here...\n\nTip: use clear formatting for readability.`}
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              if (error) setError("");
            }}
          />
        </section>

        <form
          onSubmit={handleSubmit}
          className="lg:col-span-2 rounded-2xl bg-surface shadow-3xl glow-hover p-4 sm:p-5 flex flex-col gap-4"
        >
          {error && (
            <div className="rounded-lg bg-error/10 border border-error/30 px-3 py-2">
              <p className="text-error text-sm">{error}</p>
            </div>
          )}

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
            <label className="text-text-secondary text-sm">Description</label>
            <textarea
              className="rounded-lg px-3 py-3 bg-surface-lite focus:outline-none focus:bg-surface-lite-focus transition-colors duration-200 ease-in-out resize-none min-h-32"
              placeholder="Short description (what does this code do?)"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (error) setError("");
              }}
            />
          </div>

          <div className="h-full flex flex-col gap-2">
            <label className="text-text-secondary text-sm">About</label>
            <textarea
              className="h-full rounded-lg px-3 py-3 bg-surface-lite focus:outline-none focus:bg-surface-lite-focus transition-colors duration-200 ease-in-out resize-none min-h-28"
              placeholder="Extra context, usage notes, caveats, etc."
              value={about}
              onChange={(e) => {
                setAbout(e.target.value);
                if (error) setError("");
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isDisabled}
            className="bg-primary hover:bg-primary-hover rounded-lg px-4 py-4 text-text-buttons transition-all duration-200 ease-in-out disabled:opacity-70 hover:-translate-y-0.5 active:translate-y-0"
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </form>
      </div>
    </main>
  );
};

export default CreatePostPage;
