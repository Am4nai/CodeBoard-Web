import React, { useEffect, useState } from "react";
import { api } from "../api/axiosInstance";
import type { Collection, PostCardProps } from "../types/interfaces";
import Masonry from "react-masonry-css";
import PostCard from "../components/ui/PostCard";
import axios from "axios";
import type { CollectionWithPostsResponse } from "../types/interfaces";

const CollectionPage: React.FC = () => {
  const breakpointColumnsObj = {
    default: 3,
    1024: 2,
    640: 1,
  };

  const [isCreating, setIsCreating] = useState(true);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [posts, setPosts] = useState<PostCardProps[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [loadingCollections, setLoadingCollections] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const fetchCollections = async () => {
    try {
      setError("");
      setLoadingCollections(true);
      const response = await api.get<Collection[]>("/collections");
      setCollections(response.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load collections. Please try again.");
    } finally {
      setLoadingCollections(false);
    }
  };

  const createCollection = async () => {
    try {
      setError("");

      const name = title.trim();
      const desc = description.trim();

      if (!name) {
        setError("Name is required.");
        return;
      }

      setSaving(true);
      await api.post("/collections", { name, description: desc || null });
      await fetchCollections();

      setTitle("");
      setDescription("");
    } catch (err) {
      console.log(err);
      if (axios.isAxiosError(err)) {
        const apiError = (err.response?.data as { error?: string } | undefined)?.error;
        setError(apiError || "Failed to create collection. Please try again.");
      } else {
        setError("Failed to create collection. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  const fetchCollectionData = async (collectionId?: number) => {
    const idToLoad = collectionId ?? selectedCollection?.id;
    if (!idToLoad) return;

    try {
      setLoadingPosts(true);
      setError("");

      const res = await api.get<CollectionWithPostsResponse>(`/collections/${idToLoad}`);

      const mapped: PostCardProps[] = res.data.posts.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description ?? "",
        code: p.code,
        language: p.language_name,
        authorName: p.author_name,
        createdAt: p.created_at,
        likes: p.like_count,
        comments: p.comment_count,
      }));

      setPosts(mapped);
    } catch (err) {
      console.log(err);
      if (axios.isAxiosError(err)) {
        const apiError = (err.response?.data as { error?: string } | undefined)?.error;
        setError(apiError || "Failed to load collection. Please try again.");
      } else {
        setError("Failed to load collection. Please try again.");
      }
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  const updateSelectedCollection = async () => {
    if (!selectedCollection) return;

    try {
      setError("");

      const name = title.trim();
      const desc = description.trim();

      if (!name) {
        setError("Name is required.");
        return;
      }

      setSaving(true);

      await api.put(`/collections/${selectedCollection.id}`, {
        name,
        description: desc || null,
      });

      await fetchCollections();

      setSelectedCollection((prev) => (prev ? { ...prev, name, description: desc } : prev));
    } catch (err) {
      console.log(err);
      if (axios.isAxiosError(err)) {
        const apiError = (err.response?.data as { error?: string } | undefined)?.error;
        setError(apiError || "Failed to update collection. Please try again.");
      } else {
        setError("Failed to update collection. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteSelectedCollection = async () => {
    if (!selectedCollection) return;

    const ok = window.confirm(
      "Delete this collection? Posts will not be deleted — only the collection and its links."
    );
    if (!ok) return;

    try {
      setError("");
      setSaving(true);

      await api.delete(`/collections/${selectedCollection.id}`);

      setIsCreating(true);
      setSelectedCollection(null);
      setTitle("");
      setDescription("");
      setPosts([]);

      await fetchCollections();
    } catch (err) {
      console.log(err);
      if (axios.isAxiosError(err)) {
        const apiError = (err.response?.data as { error?: string } | undefined)?.error;
        setError(apiError || "Failed to delete collection. Please try again.");
      } else {
        setError("Failed to delete collection. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  useEffect(() => {
    if (selectedCollection) {
      fetchCollectionData(selectedCollection.id);
    } else {
      setPosts([]);
    }
  }, [selectedCollection?.id]);

  const isEmptyPosts = !loadingPosts && !error && !isCreating && posts.length === 0;

  return (
    <main className="p-4 sm:p-6 text-text">
      <section className="mb-6 flex flex-col gap-2 animate-fade-up">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Collections</h1>
          <p className="text-text-secondary">
            Create collections and save posts you want to keep.
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-error/10 border border-error/30 px-3 py-2">
            <p className="text-error text-sm">{error}</p>
          </div>
        )}
      </section>

      <section className="rounded-2xl bg-surface shadow-3xl p-4 animate-fade-up">
        <label className="block text-sm text-text-secondary mb-2">
          Select a collection
        </label>

        <select
          className="w-full bg-surface-lite rounded-lg px-4 py-3 focus:outline-none focus:bg-surface-lite-focus transition-colors duration-200"
          onChange={(e) => {
            const value = e.target.value;

            if (value === "create") {
              setIsCreating(true);
              setSelectedCollection(null);
              setTitle("");
              setDescription("");
              setPosts([]);
              return;
            }

            setIsCreating(false);
            const found = collections.find((col) => col.id === Number(value));
            setSelectedCollection(found || null);

            setTitle(found?.name || "");
            setDescription(found?.description || "");
          }}
          value={isCreating ? "create" : String(selectedCollection?.id ?? "")}
          disabled={loadingCollections}
        >
          <option value="" disabled hidden>
            {loadingCollections ? "Loading..." : "Select collection..."}
          </option>
          <option value="create">➕ Create collection</option>
          {collections.map((col) => (
            <option key={col.id} value={col.id}>
              {col.name}
            </option>
          ))}
        </select>
      </section>

      {isCreating ? (
        <section className="mt-6 rounded-2xl bg-surface glow-hover shadow-3xl p-4 animate-fade-up">
          <h2 className="text-xl font-semibold tracking-tight mb-4">Create collection</h2>

          <label className="block text-sm text-text-secondary mb-1">Name</label>
          <input
            placeholder="My collection..."
            className="w-full rounded-lg px-4 py-3 bg-surface-lite focus:bg-surface-lite-focus focus:outline-none transition-colors duration-200"
            onChange={(e) => setTitle(e.target.value)}
            value={title}
          />

          <label className="block text-sm text-text-secondary mb-1 mt-4">Description (optional)</label>
          <input
            placeholder="Short description..."
            className="w-full rounded-lg px-4 py-3 bg-surface-lite focus:bg-surface-lite-focus focus:outline-none transition-colors duration-200"
            onChange={(e) => setDescription(e.target.value)}
            value={description}
          />

          <button
            type="button"
            className="w-full mt-5 bg-primary hover:bg-primary-hover transition-all duration-200 rounded-lg p-4 text-text-buttons disabled:opacity-70 hover:-translate-y-0.5 active:translate-y-0"
            onClick={createCollection}
            disabled={saving}
          >
            {saving ? "Creating..." : "Create"}
          </button>
        </section>
      ) : (
        <section className="mt-6 animate-fade-up">
          <div className="rounded-2xl bg-surface glow-hover shadow-3xl p-4">
            <h2 className="text-xl font-semibold tracking-tight mb-4">Edit collection</h2>

            <label className="block text-sm text-text-secondary mb-1">Name</label>
            <input
              placeholder="Title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg px-4 py-3 bg-surface-lite focus:bg-surface-lite-focus focus:outline-none transition-colors duration-200"
            />

            <label className="block text-sm text-text-secondary mb-1 mt-4">Description (optional)</label>
            <input
              placeholder="Description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg px-4 py-3 bg-surface-lite focus:bg-surface-lite-focus focus:outline-none transition-colors duration-200"
            />

            <div className="mt-5 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                className="grow bg-secondary hover:bg-secondary-hover transition-all duration-200 rounded-lg p-4 text-text-buttons disabled:opacity-70 hover:-translate-y-0.5 active:translate-y-0"
                onClick={updateSelectedCollection}
                disabled={saving}
              >
                {saving ? "Saving..." : "Update"}
              </button>

              <button
                type="button"
                className="grow bg-primary hover:bg-primary-hover transition-all duration-200 rounded-lg p-4 text-text-buttons disabled:opacity-70 hover:-translate-y-0.5 active:translate-y-0"
                onClick={deleteSelectedCollection}
                disabled={saving}
              >
                Delete
              </button>
            </div>
          </div>

          <div className="mt-8">
            {loadingPosts && (
              <div className="rounded-2xl bg-surface glow-hover shadow-3xl px-6 py-5">
                <p className="text-text-secondary">Loading posts...</p>
              </div>
            )}

            {isEmptyPosts && (
              <div className="rounded-2xl bg-surface glow-hover shadow-3xl px-6 py-6">
                <h3 className="text-lg font-semibold tracking-tight">No posts in this collection</h3>
                <p className="text-text-secondary mt-2">
                  Add posts from Home by clicking the “➕” button on a post.
                </p>
              </div>
            )}

            {!loadingPosts && posts.length > 0 && (
              <Masonry
                breakpointCols={breakpointColumnsObj}
                className="flex gap-6"
                columnClassName="space-y-6"
              >
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    {...post}
                    mode="remove"
                    collectionId={selectedCollection?.id}
                    fetchCollectionData={() => fetchCollectionData(selectedCollection?.id)}
                  />
                ))}
              </Masonry>
            )}
          </div>
        </section>
      )}
    </main>
  );
};

export default CollectionPage;
