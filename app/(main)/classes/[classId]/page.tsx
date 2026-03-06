"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export default function ClassPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = use(params);
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [className, setClassName] = useState("");
  const [search, setSearch] = useState("");

  const fetchPosts = useCallback(async () => {
    try {
      const searchParams = new URLSearchParams();
      searchParams.set("classId", classId);
      if (search) searchParams.set("search", search);
      searchParams.set("limit", "20");

      const res = await fetch(`/api/posts?${searchParams}`);
      const data = await res.json();
      setPosts(data.posts || []);

      // Try to get class name from posts
      if (data.posts?.length > 0 && data.posts[0].class) {
        setClassName(data.posts[0].class.name);
      }
    } catch {
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, [classId, search]);

  useEffect(() => {
    // Also fetch class info
    fetch("/api/classes")
      .then((res) => res.json())
      .then((data) => {
        const cls = data.find((c: { id: string; name: string }) => c.id === classId);
        if (cls) setClassName(cls.name);
      })
      .catch(console.error);
  }, [classId]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/classes")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-orthodox-parchment">
            {className || "Class"}
          </h1>
          <p className="text-sm text-orthodox-parchment/40">
            Class feed and discussions
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-orthodox-parchment/40" />
        <Input
          placeholder="Search in this class..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <CreatePost classId={classId} onPostCreated={fetchPosts} />

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-orthodox-gold" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-orthodox-parchment/40 text-lg">No posts in this class yet</p>
          <p className="text-orthodox-parchment/30 text-sm mt-1">
            Be the first to share something!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onUpdate={fetchPosts} />
          ))}
        </div>
      )}
    </div>
  );
}
