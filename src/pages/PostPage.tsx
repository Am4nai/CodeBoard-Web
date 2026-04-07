import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api/axiosInstance";
import { useParams, useNavigate } from "react-router-dom";
import CommentThread from "../components/ui/CommentThread";
import type { Comment } from "../types/interfaces";

import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
import "prismjs/plugins/autoloader/prism-autoloader.min.js";
Prism.plugins.autoloader.languages_path =
  "https://unpkg.com/prismjs@1.29.0/components/";

import heartoff from "../components/svg/heartoff.svg";
import hearton from "../components/svg/hearton.svg";
import commentIcon from "../components/svg/comment.svg";
import axios from "axios";
import type { PostByIdResponse } from "../types/interfaces";

const PostPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const postId = Number(id);

  const navigate = useNavigate();

  const [authorId, setAuthorId] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorAvatarUrl, setAuthorAvatarUrl] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [about, setAbout] = useState("");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  const [commentsHidden, setCommentsHidden] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [focusedCommentId, setFocusedCommentId] = useState<number | null>(null);
  const [commentText, setCommentText] = useState("");

  const [error, setError] = useState("");

  const likeIcon = isLiked ? hearton : heartoff;

  const languageForPrism = useMemo(() => {
    const raw = (language || "javascript").toLowerCase();
    if (raw === "ts") return "typescript";
    if (raw === "js") return "javascript";
    if (raw === "c#") return "csharp";
    if (raw === "c++") return "cpp";
    return raw.replace(/\s+/g, "");
  }, [language]);

  const refreshComments = async () => {
    if (!Number.isFinite(postId)) return;
    const res = await api.get<Comment[]>(`/comments/post/${postId}`);
    setComments(res.data);
  };

  const refreshCounts = async () => {
    if (!Number.isFinite(postId)) return;

    try {
      const likesRes = await api.get<{ likes_count: number }>(
        `/likes/${postId}/count`
      );
      setLikeCount(likesRes.data.likes_count);
    } catch {
    }

    try {
      const commentsRes = await api.get<{ count: number }>(
        `/comments/post/${postId}/count`
      );
      setCommentCount(commentsRes.data.count);
    } catch {
    }
  };

  const handleTagClick = (tag: string) => {
    navigate(`/search?query=${encodeURIComponent(`#${tag}`)}`);
  };

  const fetchPostById = async () => {
    if (!Number.isFinite(postId)) {
      setError("Invalid post id.");
      return;
    }

    try {
      setError("");

      const postRes = await api.get<PostByIdResponse>(`/posts/${postId}`);
      const p = postRes.data;

      setAuthorId(p.author_id);
      setAuthorName(p.author_name);
      setAuthorAvatarUrl(p.author_avatar_url);

      setTitle(p.title);
      setDescription(p.description ?? "");
      setAbout(p.about ?? "");
      setCode(p.code);
      setLanguage(p.language_name);
      setTags(p.tags ?? []);

      setLikeCount(p.like_count);
      setCommentCount(p.comment_count);

      try {
        const likedRes = await api.get<{ liked: boolean }>(
          `/likes/${postId}/is-liked`
        );
        setIsLiked(!!likedRes.data.liked);
      } catch {
        setIsLiked(false);
      }

      await refreshComments();
    } catch (err) {
      console.log(err);
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setError("Post not found.");
      } else {
        setError("Failed to load the post. Please try again.");
      }
    }
  };

  const handleLikeSubmit = async () => {
    if (!Number.isFinite(postId)) return;

    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikeCount((prev) => Math.max(0, prev + (nextLiked ? 1 : -1)));

    try {
      const res = await api.post<{ liked: boolean; likes_count: number }>(
        `/likes/${postId}/toggle`
      );
      setIsLiked(res.data.liked);
      setLikeCount(res.data.likes_count);
    } catch (err) {
      setIsLiked(!nextLiked);
      setLikeCount((prev) => Math.max(0, prev + (nextLiked ? -1 : 1)));
      console.log(err);
    }
  };

  const handleToggleComments = () => {
    setCommentsHidden((prev) => !prev);
  };

  const handleWriteComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!Number.isFinite(postId)) return;

    const content = commentText.trim();
    if (!content) return;

    try {
      await api.post("/comments", {
        post_id: postId,
        content,
        parent_id: null,
      });

      setCommentText("");
      await refreshComments();
      await refreshCounts();
    } catch (err) {
      console.log(err);
      setError("Failed to create the comment. Please try again.");
    }
  };

  useEffect(() => {
    fetchPostById();
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    if (code) Prism.highlightAll();
  }, [code, languageForPrism]);

  useEffect(() => {
    if (!commentsHidden) {
      setTimeout(() => {
        const el = document.getElementById("comments-panel");
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    }
  }, [commentsHidden]);

  const avatar = authorAvatarUrl || "https://placehold.co/40x40";

  return (
    <main className="bg-bg text-text px-4 sm:px-6 py-6 min-h-[calc(100vh-8rem)]">
      <section className="max-w-7xl mx-auto mb-6 animate-fade-up">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold tracking-tight line-clamp-2">
              {title || "Post"}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-text-secondary">
              <button
                type="button"
                onClick={() => navigate(`/profile/${authorId}`)}
                className="inline-flex items-center gap-2 hover:text-primary transition-colors"
                title="Open author profile"
              >
                <img
                  src={avatar}
                  alt={authorName || "Author"}
                  className="w-7 h-7 rounded-full border object-cover"
                />
                <span className="truncate max-w-56">{authorName}</span>
              </button>

              <span aria-hidden>•</span>

              <span className="truncate">
                Language: <span className="text-text">{language || "—"}</span>
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {tags.length > 0 ? (
                tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagClick(tag)}
                    className="inline-flex items-center rounded-full bg-primary/15 border border-primary/30 px-3 py-1 text-sm text-text hover:bg-primary/25 transition-colors duration-200"
                    title={`Search posts by #${tag}`}
                  >
                    #{tag}
                  </button>
                ))
              ) : (
                <span className="text-sm text-text-secondary">No tags</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleLikeSubmit}
              className="flex items-center gap-2 rounded-xl bg-surface px-3 py-2 shadow-3xl hover:bg-surface-focus transition-colors active:scale-[0.98]"
              title={isLiked ? "Unlike" : "Like"}
            >
              <img className="h-6 w-6" src={likeIcon} alt="like" />
              <span className="text-sm text-text-secondary">{likeCount}</span>
            </button>

            <button
              type="button"
              onClick={handleToggleComments}
              className="flex items-center gap-2 rounded-xl bg-surface px-3 py-2 shadow-3xl hover:bg-surface-focus transition-colors active:scale-[0.98]"
              title="Toggle comments"
            >
              <img className="h-6 w-6" src={commentIcon} alt="comments" />
              <span className="text-sm text-text-secondary">{commentCount}</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-5 rounded-lg bg-error/10 border border-error/30 px-3 py-2">
            <p className="text-error text-sm">{error}</p>
          </div>
        )}
      </section>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-6">
        <section className="lg:col-span-3 rounded-2xl bg-surface shadow-3xl glow-hover p-4 sm:p-5 flex flex-col min-h-0">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Code</h2>
          </div>

          <div className="mt-4 rounded-xl overflow-hidden flex-1 min-h-0">
            <pre className="m-0! p-4 overflow-auto bg-surface-lite! h-full">
              <code className={`language-${languageForPrism}`}>
                {code}
              </code>
            </pre>
          </div>
        </section>

        <section className="lg:col-span-2 rounded-2xl bg-surface shadow-3xl glow-hover p-4 sm:p-5 animate-fade-up">
          <h2 className="text-lg font-semibold tracking-tight">Description</h2>

          <div className="mt-3 rounded-xl bg-surface-lite p-4">
            {description ? (
              <p className="text-sm leading-relaxed text-text-secondary whitespace-pre-wrap">
                {description}
              </p>
            ) : (
              <p className="text-sm text-text-secondary">No description provided.</p>
            )}
          </div>

          <div className="mt-4">
            <h3 className="text-sm font-semibold text-text-secondary">About</h3>
            <div className="mt-2 rounded-xl bg-surface-lite p-4">
              {about ? (
                <p className="text-sm leading-relaxed text-text-secondary whitespace-pre-wrap">
                  {about}
                </p>
              ) : (
                <p className="text-sm text-text-secondary">(No extra details)</p>
              )}
            </div>
          </div>
        </section>
      </div>

      <section
        id="comments-panel"
        className="max-w-7xl mx-auto mt-8 animate-fade-up"
        hidden={commentsHidden}
      >
        <div className="rounded-2xl bg-surface shadow-3xl glow-hover overflow-hidden">
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 bg-surface-focus">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Comments</h2>
              <p className="text-sm text-text-secondary">
                Reply threads are supported (up to the backend nesting limit).
              </p>
            </div>

            <button
              type="button"
              onClick={() => setCommentsHidden(true)}
              className="text-sm font-semibold text-primary hover:text-primary-hover transition-colors"
            >
              Hide
            </button>
          </div>

          <div className="p-4 sm:p-6">
            <form
              className="flex flex-col sm:flex-row gap-3"
              onSubmit={handleWriteComment}
            >
              <textarea
                className="grow rounded-2xl px-4 py-3 bg-surface-lite focus:outline-none focus:bg-surface-lite-focus transition-colors duration-200 ease-in-out resize-none text-text min-h-8"
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => {
                  setCommentText(e.target.value);
                  if (error) setError("");
                }}
                onFocus={() => setFocusedCommentId(postId)}
              />
              <button
                type="submit"
                className="bg-primary hover:bg-primary-hover rounded-2xl px-6 py-3 text-text-buttons transition-all duration-200 ease-in-out hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70"
                disabled={!commentText.trim()}
              >
                Post
              </button>
            </form>

            <div className="mt-6 space-y-3">
              {comments.length === 0 ? (
                <div className="rounded-xl bg-surface-lite p-4">
                  <p className="text-sm text-text-secondary">
                    No comments yet. Be the first to comment.
                  </p>
                </div>
              ) : (
                comments.map((c) => (
                  <CommentThread
                    key={c.id}
                    comment={c}
                    level={0}
                    post_id={postId}
                    focusedCommentId={focusedCommentId}
                    setFocusedCommentId={setFocusedCommentId}
                    refreshComments={refreshComments}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default PostPage;