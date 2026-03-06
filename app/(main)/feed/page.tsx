"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CreatePost } from "@/components/feed/create-post";
import { PostCard } from "@/components/feed/post-card";
import { toast } from "sonner";

interface Post {
  id: string;
  title: string | null;
  content: string;
  image: string | null;
  isGlobal: boolean;
  isPinned: boolean;
  createdAt: string;
  author: {
    id: string;
    fullName: string | null;
    name: string | null;
    image: string | null;
    role: string;
  };
  class: { id: string; name: string } | null;
  _count: { comments: number; likes: number };
  likes: { userId: string }[];
  saves: { userId: string }[];
}

export default function FeedPage() {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPosts = useCallback(async (reset = false) => {
    try {
      const params = new URLSearchParams();
      if (!reset && cursor) params.set("cursor", cursor);
      if (search) params.set("search", search);
      params.set("limit", "10");

      const res = await fetch(`/api/posts?${params}`);
      const data = await res.json();

      if (reset) {
        setPosts(data.posts);
      } else {
        setPosts((prev) => [...prev, ...data.posts]);
      }
      setCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
    } catch {
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [cursor, search]);

  useEffect(() => {
    setLoading(true);
    setCursor(undefined);
    fetchPosts(true);
  }, [search]);

  const loadMore = () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    fetchPosts();
  };

  const handlePostCreated = () => {
    setCursor(undefined);
    fetchPosts(true);
  };

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 500
      ) {
        loadMore();
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasMore, loadingMore, cursor]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-orthodox-parchment/40" />
        <Input
          placeholder="Search posts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Create post */}
      <CreatePost onPostCreated={handlePostCreated} />

      {/* Posts feed */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-orthodox-gold" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-orthodox-parchment/40 text-lg">No posts yet</p>
          <p className="text-orthodox-parchment/30 text-sm mt-1">
            Be the first to share something with the community!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onUpdate={handlePostCreated} />
          ))}
          {loadingMore && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-orthodox-gold" />
            </div>
          )}
          {!hasMore && posts.length > 0 && (
            <p className="text-center text-sm text-orthodox-parchment/30 py-4">
              You&apos;ve reached the end
            </p>
          )}
        </div>
      )}
    </div>
  );
}
