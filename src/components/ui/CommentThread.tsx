import React, { useState } from "react";
import type { CommentThreadProps } from "../../types/interfaces";
import { api } from "../../api/axiosInstance";
import axios from "axios";

const CommentThread: React.FC<CommentThreadProps> = ({
  comment,
  post_id,
  focusedCommentId,
  setFocusedCommentId,
  refreshComments,
}) => {
  const isFocused = focusedCommentId === comment.id;
  const [commentText, setCommentText] = useState("");
  const [error, setError] = useState("");

  const effectivePostId = post_id ?? comment.post_id;

  const toggleReply = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    setError("");
    setFocusedCommentId(isFocused ? null : comment.id);
  };

  const createComment = async () => {
    if (!effectivePostId) {
      setError("Post id is missing.");
      return;
    }

    const content = commentText.trim();
    if (!content) {
      setError("Please write a reply.");
      return;
    }

    try {
      setError("");

      await api.post("/comments", {
        post_id: effectivePostId,
        content,
        parent_id: comment.id,
      });

      setCommentText("");
      setFocusedCommentId(null);
      await refreshComments();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const apiError = (err.response?.data as { error?: string } | undefined)?.error;
        setError(apiError || "Failed to create comment. Please try again.");
        return;
      }
      setError("Failed to create comment. Please try again.");
    }
  };

  return (
    <div className="relative pl-4">
      <div className="flex justify-between gap-3 p-3 rounded-xl bg-surface-lite shadow-sm animate-fade-up transition-all duration-200 ease-in-out">
        <section className="flex flex-col min-w-0">
          <p className="font-semibold truncate">{comment.username}</p>
          <p className="text-sm text-text-secondary wrap-break-words">{comment.content}</p>
        </section>

        <div className="shrink-0 flex items-start">
          <button
            type="button"
            onClick={toggleReply}
            className="text-xs sm:text-sm px-3 py-1.5 rounded-lg bg-surface-lite hover:bg-surface-lite-focus transition-colors text-text"
            aria-expanded={isFocused}
            aria-label={isFocused ? "Close reply" : "Reply"}
            title={isFocused ? "Close" : "Reply"}
          >
            {isFocused ? "Close" : "Reply"}
          </button>
        </div>
      </div>

      {isFocused && (
        <div className="flex flex-col mt-2 gap-2 animate-fade-up">
          <div className="flex flex-col sm:flex-row gap-3" onClick={(e) => e.stopPropagation()}>
            <textarea
              placeholder="Write a reply..."
              className="grow rounded-lg px-4 py-2 min-h-12 bg-surface-lite focus:outline-none focus:bg-surface-lite-focus transition-colors duration-200 ease-in-out text-text resize-none"
              value={commentText}
              onChange={(e) => {
                setCommentText(e.target.value);
                if (error) setError("");
              }}
              autoFocus
            />

            <button
              type="button"
              className="shrink-0 bg-secondary hover:bg-secondary-hover rounded-lg px-4 py-2 text-text-buttons transition-all duration-200 ease-in-out hover:-translate-y-0.5 active:translate-y-0"
              onClick={createComment}
            >
              Send
            </button>
          </div>

          {error && (
            <div className="rounded-lg bg-error/10 border border-error/30 px-3 py-2">
              <p className="text-error text-sm">{error}</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-2 ml-4 space-y-2 border-l rounded-bl-2xl border-border">
        {comment.replies.map((reply) => (
          <CommentThread
            key={reply.id}
            comment={reply}
            post_id={effectivePostId} // ✅ протаскиваем сверху
            focusedCommentId={focusedCommentId}
            setFocusedCommentId={setFocusedCommentId}
            refreshComments={refreshComments}
          />
        ))}
      </div>
    </div>
  );
};

export default CommentThread;
