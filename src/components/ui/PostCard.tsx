import React, { useState } from "react";
import type { PostCardProps } from "../../types/interfaces";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/axiosInstance";
import AddToCollectionModal from "./AddToCollectionModal";

const PostCard: React.FC<PostCardProps> = ({
  id,
  title,
  description,
  authorName,
  createdAt,
  likes,
  comments,
  views,
  editable,
  mode,
  collectionId,
  fetchCollectionData,
}) => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  const handleOpen = () => navigate(editable ? `/edit/${id}` : `/post/${id}`);

  return (
    <article
      className="w-full break-inside-avoid opacity-0 animate-fade-up"
      onClick={handleOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleOpen();
      }}
    >
      <div
        className="
          group flex flex-col w-full
          rounded-2xl shadow-3xl
          bg-surface-lite text-text
          transition-colors duration-200 ease-in-out
          md:hover:bg-surface
        "
      >
        <div className="px-4 pt-3 pb-2 sm:px-5 sm:pt-4 sm:pb-3">
          <h3 className="font-bold tracking-tight text-base sm:text-lg line-clamp-2">
            {title}
          </h3>

          {!!description && (
            <p className="mt-1 text-sm leading-relaxed text-text-secondary line-clamp-3">
              {description}
            </p>
          )}
        </div>

        <footer className="mt-auto px-4 py-2 sm:px-5 bg-surface rounded-b-2xl">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm text-text truncate">{authorName}</div>
              <div className="text-xs text-text-secondary">
                {new Date(createdAt).toLocaleDateString()}
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 text-sm text-text-secondary">
              <span className="flex items-center gap-1" title="Views">
                <span>{views ?? 0}</span>
                <span aria-hidden>👁️</span>
              </span>

              <span className="flex items-center gap-1" title="Likes">
                <span>{likes ?? 0}</span>
                <span aria-hidden>❤️</span>
              </span>

              <span className="flex items-center gap-1" title="Comments">
                <span>{comments ?? 0}</span>
                <span aria-hidden>💬</span>
              </span>

              {mode === "add" && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowModal(true);
                  }}
                  className="text-primary hover:text-primary-hover transition-colors"
                  title="Add to collection"
                  aria-label="Add to collection"
                >
                  ➕
                </button>
              )}

              {mode === "remove" && collectionId && (
                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (!fetchCollectionData) return;
                    await api.delete(`/collections/${collectionId}/posts/${id}`);
                    fetchCollectionData();
                  }}
                  className="text-error hover:opacity-90 transition-opacity"
                  title="Remove from collection"
                  aria-label="Remove from collection"
                >
                  🗑
                </button>
              )}
            </div>
          </div>
        </footer>

        {showModal && (
          <AddToCollectionModal postId={id} onClose={() => setShowModal(false)} />
        )}
      </div>
    </article>
  );
};

export default PostCard;