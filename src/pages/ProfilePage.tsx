import React, { useEffect, useState } from "react";
import type { PostCardProps } from "../types/interfaces";
import PostCard from "../components/ui/PostCard";
import { api } from "../api/axiosInstance";
import Masonry from "react-masonry-css";
import { useParams } from "react-router-dom";
import axios from "axios";

type UserResponse = {
  id: string;
  username: string;
  email: string;
  role: string;
  created_at: string;
  profile: {
    avatar_url: string | null;
    description: string | null;
    about: string | null;
  } | null;
};

type UserPostsResponse = {
  userId: string;
  total: number;
  posts: Array<{
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
    created_at: string;
    updated_at: string;
    comment_count: number;
  }>;
};

const ProfilePage: React.FC = () => {
  const breakpointColumnsObj = {
    default: 3,
    1024: 2,
    640: 1,
  };

  const { id } = useParams<{ id: string }>();
  const profileUserId = id;

  const authUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isOwner = authUser?.id === profileUserId;

  const [posts, setPosts] = useState<PostCardProps[]>([]);

  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  const [description, setDescription] = useState("");
  const [about, setAbout] = useState("");

  const [createdAt, setCreatedAt] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchPosts = async (uid: string) => {
    try {
      setLoadingPosts(true);
      setError("");

      const response = await api.get<UserPostsResponse>(`/users/${uid}/posts`);

      const mapped: PostCardProps[] = response.data.posts.map((p) => ({
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
      setError("Failed to load posts. Please try again.");
    } finally {
      setLoadingPosts(false);
    }
  };

  const getProfile = async () => {
    console.log("user id.", profileUserId);
    
    if (!profileUserId) {
      setError("Invalid user id.");
      setLoadingProfile(false);
      setLoadingPosts(false);
      return;
    }

    try {
      setLoadingProfile(true);
      setError("");

      const userRes = await api.get<UserResponse>(`/users/${profileUserId}`);
      const u = userRes.data;

      setUserId(u.id);
      setUsername(u.username);
      setEmail(u.email);
      setCreatedAt(u.created_at);

      setAvatarUrl(u.profile?.avatar_url ?? null);
      setDescription(u.profile?.description ?? "");
      setAbout(u.profile?.about ?? "");

      setPosts([]);
      await fetchPosts(u.id);
    } catch (err) {
      console.log(err);
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setError("User not found.");
      } else {
        setError("Failed to load profile. Please try again.");
      }
      setLoadingPosts(false);
    } finally {
      setLoadingProfile(false);
    }
  };

  const updateProfile = async () => {
    if (!userId) return;

    try {
      setSaving(true);
      setError("");

      const res = await api.put<UserResponse>(`/users/${userId}`, {
        username,
        email,
        avatar_url: avatarUrl,
        description,
        about,
      });

      const u = res.data;

      setUsername(u.username);
      setEmail(u.email);
      setAvatarUrl(u.profile?.avatar_url ?? null);
      setDescription(u.profile?.description ?? "");
      setAbout(u.profile?.about ?? "");

      if (isOwner) {
        localStorage.setItem("user", JSON.stringify(u));
      }
    } catch (err) {
      console.log(err);

      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const apiError = (err.response?.data as { error?: string } | undefined)?.error;

        if (status === 401) setError("Please sign in to update your profile.");
        else if (status === 403) setError("You don't have permission to update this profile.");
        else if (status === 409) setError(apiError || "Username or email is already taken.");
        else setError(apiError || "Failed to update profile. Please try again.");
      } else {
        setError("Failed to update profile. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    getProfile();
  }, [id]);

  const avatarSrc = avatarUrl || "https://placehold.co/128x128";
  const isEmptyPosts = !loadingPosts && posts.length === 0 && !error;

  return (
    <main className="p-4 sm:p-6 text-text">
      {error && (
        <div className="mb-4 rounded-lg bg-error/10 border border-error/30 px-3 py-2 animate-fade-up">
          <p className="text-error text-sm">{error}</p>
        </div>
      )}

      <section className="rounded-2xl bg-surface glow-hover shadow-3xl p-4 sm:p-6 animate-fade-up">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
          <div className="flex flex-col items-center lg:items-start gap-3 lg:w-72">
            <div className="w-full flex items-center justify-between lg:justify-start">
              <h1 className="text-2xl font-bold tracking-tight">Profile</h1>

              {isOwner && (
                <button
                  type="button"
                  onClick={updateProfile}
                  disabled={saving || loadingProfile}
                  className="lg:hidden bg-primary hover:bg-primary-hover transition-colors rounded-lg px-4 py-2 text-text-buttons disabled:opacity-70"
                >
                  {saving ? "Saving..." : "Update"}
                </button>
              )}
            </div>

            <img
              src={avatarSrc}
              alt="avatar"
              className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border object-cover"
            />

            {isOwner && (
              <input
                disabled={saving || loadingProfile}
                type="text"
                className="w-full text-sm rounded-lg px-3 py-2 bg-surface-lite focus:bg-surface-lite-focus focus:outline-none transition-colors duration-200"
                placeholder="Avatar URL..."
                value={avatarUrl ?? ""}
                onChange={(e) => setAvatarUrl(e.target.value)}
              />
            )}

            <input
              disabled={!isOwner || saving || loadingProfile}
              type="text"
              className={`w-full rounded-lg px-3 py-2 bg-surface-lite focus:bg-surface-lite-focus focus:outline-none transition-colors duration-200 ${
                !isOwner ? "opacity-80 cursor-default" : ""
              }`}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <input
              disabled={!isOwner || saving || loadingProfile}
              type="text"
              className={`w-full rounded-lg px-3 py-2 bg-surface-lite focus:bg-surface-lite-focus focus:outline-none transition-colors duration-200 ${
                !isOwner ? "opacity-80 cursor-default" : ""
              }`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <p className="text-xs text-text-secondary mt-1">
              Account created:{" "}
              {createdAt ? new Date(createdAt).toLocaleDateString() : ""}
            </p>

            {isOwner && (
              <button
                type="button"
                onClick={updateProfile}
                disabled={saving || loadingProfile}
                className="hidden lg:inline-flex w-full mt-2 bg-primary hover:bg-primary-hover transition-colors rounded-lg px-4 py-2 text-text-buttons disabled:opacity-70 hover:-translate-y-0.5 active:translate-y-0"
              >
                {saving ? "Saving..." : "Update profile"}
              </button>
            )}
          </div>

          <div className="flex flex-col gap-4 flex-1">
            <div>
              <label className="block text-sm text-text-secondary mb-1">
                Description
              </label>
              <textarea
                disabled={!isOwner || saving || loadingProfile}
                className="w-full rounded-2xl px-4 py-3 bg-surface-lite focus:bg-surface-lite-focus focus:outline-none transition-colors duration-200 resize-none min-h-28"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={isOwner ? "Tell something short..." : ""}
              />
            </div>

            <div className="h-full mb-6">
              <label className="block text-sm text-text-secondary mb-1">
                About
              </label>
              <textarea
                disabled={!isOwner || saving || loadingProfile}
                className="h-full w-full rounded-2xl px-4 py-3 bg-surface-lite focus:bg-surface-lite-focus focus:outline-none transition-colors duration-200 resize-none min-h-28"
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                placeholder={isOwner ? "More details about you..." : ""}
              />
            </div>

            {loadingProfile && (
              <p className="text-text-secondary text-sm">Loading profile...</p>
            )}
          </div>
        </div>
      </section>

      <section className="mt-8 animate-fade-up">
        <div className="flex items-end justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {isOwner ? "My posts" : "Posts"}
            </h2>
            <p className="text-text-secondary">
              {isOwner ? "Your recent posts." : "User's recent posts."}
            </p>
          </div>
        </div>

        {loadingPosts && (
          <div className="rounded-2xl bg-surface px-6 py-5 glow-hover">
            <p className="text-text-secondary">Loading posts...</p>
          </div>
        )}

        {isEmptyPosts && (
          <div className="rounded-2xl bg-surface px-6 py-6 glow-hover">
            <h3 className="text-lg font-semibold tracking-tight">No posts yet</h3>
            <p className="text-text-secondary mt-2">
              {isOwner
                ? "Create your first post and it will appear here."
                : "This user hasn't posted anything yet."}
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
              <PostCard key={post.id} {...post} editable={isOwner} mode="add" />
            ))}
          </Masonry>
        )}
      </section>
    </main>
  );
};

export default ProfilePage;
