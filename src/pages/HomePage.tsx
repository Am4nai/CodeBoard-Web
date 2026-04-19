import React, { useEffect, useRef, useState } from "react";
import Masonry from "react-masonry-css";
import PostCard from "../components/ui/PostCard";
import type { PostCardProps } from "../types/interfaces";
import { api } from "../api/axiosInstance";
import type { PostsResponse } from "../types/interfaces";

const HomePage: React.FC = () => {
  const breakpointColumnsObj = {
    default: 3,
    1280: 3,
    1024: 2,
    768: 2,
    640: 1,
  };

  const [posts, setPosts] = useState<PostCardProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [remainingPosts, setRemainingPosts] = useState<number | null>(null);

  const isThrottled = useRef(false);
  const isFetching = useRef(false);

  const fetchPosts = async (pageToLoad: number) => {
    if (isFetching.current) return;
    if (remainingPosts !== null && remainingPosts <= 0) return;

    isFetching.current = true;
    setError("");

    if (pageToLoad === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const response = await api.get<PostsResponse>(`/posts?page=${pageToLoad}&limit=15`);

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

      setPosts((prev) => {
        const seen = new Set(prev.map((x) => x.id));
        const filtered = mapped.filter((x) => !seen.has(x.id));
        return [...prev, ...filtered];
      });

      setRemainingPosts(response.data.remainingPosts);
    } catch (err) {
      console.log(err);
      setError("Failed to load posts. Please try again.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
      isFetching.current = false;
    }
  };

  const handleScroll = () => {
    if (isThrottled.current) return;
    if (remainingPosts !== null && remainingPosts <= 0) return;
    if (isFetching.current) return;

    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;

    if (scrollTop + clientHeight >= scrollHeight - 350) {
      setPage((prev) => prev + 1);
      isThrottled.current = true;
      setTimeout(() => (isThrottled.current = false), 500);
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [remainingPosts]);

  useEffect(() => {
    fetchPosts(page);
  }, [page]);

  const isEmpty = !loading && posts.length === 0 && !error;

  return (
    <main className="text-text px-4 py-6 sm:px-6 sm:py-8">
      <section className="mb-5 sm:mb-6 flex flex-col gap-2 animate-fade-up">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Home</h1>
            <p className="text-text-secondary text-sm sm:text-base">
              Explore the latest posts from the community.
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-error/10 border border-error/30 px-3 py-2">
            <p className="text-error text-sm">{error}</p>
          </div>
        )}
      </section>

      {loading && (
        <div className="rounded-2xl bg-surface px-5 py-5 sm:px-6 glow-hover animate-fade-up">
          <p className="text-text-secondary">Loading posts...</p>
        </div>
      )}

      {isEmpty && (
        <div className="rounded-2xl bg-surface px-5 py-6 sm:px-6 glow-hover animate-fade-up">
          <h2 className="text-lg sm:text-xl font-semibold tracking-tight">No posts yet</h2>
          <p className="text-text-secondary mt-2 text-sm sm:text-base">
            Be the first to share something. Create a post and it will appear here.
          </p>
        </div>
      )}

      {!loading && posts.length > 0 && (
        <>
          <Masonry
            breakpointCols={breakpointColumnsObj}
            className="flex gap-4 sm:gap-6"
            columnClassName="space-y-4 sm:space-y-6"
          >
            {posts.map((post) => (
              <PostCard key={post.id} {...post} mode="add" />
            ))}
          </Masonry>

          {loadingMore && (
            <div className="mt-6 text-center text-text-secondary animate-fade-up">
              Loading more...
            </div>
          )}

          {!loadingMore && remainingPosts === 0 && (
            <p className="text-text-secondary text-center mt-8 text-sm sm:text-base">
              You’ve reached the end.
            </p>
          )}
        </>
      )}
    </main>
  );
};

export default HomePage;
