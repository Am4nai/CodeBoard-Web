import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Masonry from "react-masonry-css";
import type { PostCardProps } from "../types/interfaces";
import PostCard from "../components/ui/PostCard";
import { api } from "../api/axiosInstance";
import type { SearchPostsResponse } from "../types/interfaces";

const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const breakpointColumnsObj = {
    default: 3,
    1024: 2,
    640: 1,
  };

  const isThrottled = useRef(false);

  const queryParams = new URLSearchParams(location.search);
  const query = queryParams.get("query") || "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [posts, setPosts] = useState<PostCardProps[]>([]);
  const [page, setPage] = useState(1);

  const sortCollection = ["views", "likes", "newest"]
  const [sort, setSort] = useState("newest")

  const parseQuery = (raw: string) => {
    const parts = raw.split(" ").filter(Boolean);
    const tags = parts.filter((w) => w.startsWith("#"));
    return { tags };
  };

  const { tags } = parseQuery(query);

  const removeTag = (tagToRemove: string) => {
    const newQuery = query
      .split(" ")
      .filter((w) => w !== tagToRemove)
      .join(" ");

    navigate(`/search?query=${encodeURIComponent(newQuery)}`);
  };

  const fetchPosts = async (opts?: { reset?: boolean; pageOverride?: number }) => {
    const reset = opts?.reset ?? false;
    const pageToLoad = opts?.pageOverride ?? page;

    const q = query.trim();
    if (!q) {
      setPosts([]);
      setLoading(false);
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.get<SearchPostsResponse>(
        `/posts/search?query=${encodeURIComponent(q)}&sort=${sort}&page=${pageToLoad}&limit=15`
      );

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

      setPosts((prev) => (reset ? mapped : [...prev, ...mapped]));
    } catch (err) {
      setError("Error fetching posts");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = () => {
    if (isThrottled.current) return;
    if (loading) return;

    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    if (scrollTop + clientHeight >= scrollHeight - 50) {
      setPage((prev) => prev + 1);
      isThrottled.current = true;
      setTimeout(() => (isThrottled.current = false), 500);
    }
  };

  useEffect(() => {
    setPage(1);
    setPosts([]);
    fetchPosts({ reset: true, pageOverride: 1 });
  }, [location.search, sort]);

  useEffect(() => {
    if (page > 1) fetchPosts();
  }, [page]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loading]);

  return (
    <main className="p-6 text-text">
      <div className="flex flex-wrap gap-2 mb-4">
        {tags.map((tag, idx) => (
          <button
            key={idx}
            className="px-3 py-1 bg-primary text-text rounded-lg hover:bg-primary-hover transition cursor-pointer"
            onClick={() => removeTag(tag)}
          >
            {tag} ×
          </button>
        ))}
      </div>

      <span className="flex justify-between">
        <h1 className="text-3xl font-bold mb-4">
          Results for: <span className="text-primary">{query}</span>
        </h1>

        <span> Sort: 
          <select
            className="bg-surface-lite rounded-lg px-4 py-2 ml-2 focus:outline-none focus:bg-surface-lite-focus transition-colors duration-200"
            value={sort}
            onChange={(e) => {setSort(e.target.value)}}
          >
            {sortCollection.map((col) => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </span>
      </span>

      {error && <p className="text-error">{error}</p>}
      {loading && <p>Loading...</p>}

      <Masonry breakpointCols={breakpointColumnsObj} className="flex gap-6" columnClassName="space-y-6">
        {posts.map((post) => (
          <PostCard key={post.id} {...post} mode="add" />
        ))}
      </Masonry>
    </main>
  );
};

export default SearchPage;
