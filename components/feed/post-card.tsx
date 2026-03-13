"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Heart, MessageCircle, Bookmark, Pin, MoreHorizontal, Send, Reply } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn, formatDate, getInitials } from "@/lib/utils";
import { toast } from "sonner";

interface PostAuthor {
  id: string;
  fullName: string | null;
  name: string | null;
  image: string | null;
  role: string;
}

interface PostClass {
  id: string;
  name: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    fullName: string | null;
    name: string | null;
    image: string | null;
  };
  replies: Comment[];
}

interface PostCardProps {
  post: {
    id: string;
    title: string | null;
    content: string;
    image: string | null;
    isGlobal: boolean;
    isPinned: boolean;
    createdAt: string;
    author: PostAuthor;
    class: PostClass | null;
    _count: { comments: number; likes: number };
    likes: { userId: string }[];
    saves: { userId: string }[];
  };
  onUpdate?: () => void;
}

export function PostCard({ post, onUpdate }: PostCardProps) {
  const { data: session } = useSession();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<{ id: string; authorName: string } | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isLiked, setIsLiked] = useState(
    post.likes.some((l) => l.userId === session?.user?.id)
  );
  const [isSaved, setIsSaved] = useState(
    post.saves.some((s) => s.userId === session?.user?.id)
  );
  const [likeCount, setLikeCount] = useState(post._count.likes);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLike = async () => {
    try {
      const res = await fetch(`/api/posts/${post.id}/like`, { method: "POST" });
      const data = await res.json();
      setIsLiked(data.liked);
      setLikeCount((prev) => (data.liked ? prev + 1 : prev - 1));
    } catch {
      toast.error("Failed to like post");
    }
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`/api/posts/${post.id}/save`, { method: "POST" });
      const data = await res.json();
      setIsSaved(data.saved);
      toast.success(data.saved ? "Post saved" : "Post unsaved");
    } catch {
      toast.error("Failed to save post");
    }
  };

  const loadComments = async () => {
    try {
      const res = await fetch(`/api/posts/${post.id}/comments`);
      const data = await res.json();
      setComments(data);
    } catch {
      toast.error("Failed to load comments");
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentText }),
      });
      if (res.ok) {
        setCommentText("");
        loadComments();
      }
    } catch {
      toast.error("Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async (parentId: string) => {
    if (!replyText.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyText, parentId }),
      });
      if (res.ok) {
        setReplyText("");
        setReplyingTo(null);
        loadComments();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to post reply");
      }
    } catch {
      toast.error("Failed to post reply");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleComments = () => {
    if (!showComments) {
      loadComments();
    }
    setShowComments(!showComments);
  };

  return (
    <Card className="overflow-hidden animate-fade-in">
      <CardContent className="p-0">
        {/* Post header */}
        <div className="flex items-start gap-3 p-4 pb-0">
          <Avatar className="h-10 w-10">
            <AvatarImage src={post.author.image || ""} />
            <AvatarFallback>{getInitials(post.author.fullName || post.author.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-orthodox-parchment">
                {post.author.fullName || post.author.name}
              </span>
              {post.author.role === "SUPER_ADMIN" && (
                <Badge variant="default" className="text-xs py-0">Admin</Badge>
              )}
              {post.author.role === "CLASS_ADMIN" && (
                <Badge variant="secondary" className="text-xs py-0">Class Admin</Badge>
              )}
              {post.class && (
                <Badge variant="outline" className="text-xs py-0">{post.class.name}</Badge>
              )}
              {post.isPinned && (
                <Pin className="h-3.5 w-3.5 text-orthodox-gold" />
              )}
            </div>
            <p className="text-xs text-orthodox-parchment/40 mt-0.5">
              {formatDate(post.createdAt)}
              {post.isGlobal && " · Global"}
            </p>
          </div>
        </div>

        {/* Post content */}
        <div className="px-4 py-3">
          {post.title && (
            <h3 className="font-semibold text-orthodox-parchment mb-1">{post.title}</h3>
          )}
          <p className="text-sm text-orthodox-parchment/80 whitespace-pre-wrap leading-relaxed">
            {post.content}
          </p>
        </div>

        {/* Post image */}
        {post.image && (
          <div className="px-4 pb-3">
            <img
              src={post.image}
              alt="Post attachment"
              className="rounded-lg w-full max-h-96 object-cover border border-orthodox-gold/10"
            />
          </div>
        )}

        {/* Stats */}
        <div className="px-4 py-2 flex items-center gap-4 text-xs text-orthodox-parchment/40">
          {likeCount > 0 && <span>{likeCount} like{likeCount !== 1 ? "s" : ""}</span>}
          {post._count.comments > 0 && (
            <span>{post._count.comments} comment{post._count.comments !== 1 ? "s" : ""}</span>
          )}
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex items-center justify-between px-2 py-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={cn(
              "flex-1 gap-2",
              isLiked && "text-orthodox-red hover:text-orthodox-red"
            )}
          >
            <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
            Like
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleComments}
            className="flex-1 gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            Comment
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            className={cn(
              "flex-1 gap-2",
              isSaved && "text-orthodox-gold hover:text-orthodox-gold"
            )}
          >
            <Bookmark className={cn("h-4 w-4", isSaved && "fill-current")} />
            Save
          </Button>
        </div>

        {/* Comments section */}
        {showComments && (
          <>
            <Separator />
            <div className="p-4 space-y-4">
              {/* Comment input */}
              <div className="flex gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={session?.user?.image || ""} />
                  <AvatarFallback className="text-xs">
                    {getInitials(session?.user?.fullName || session?.user?.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 flex gap-2">
                  <Textarea
                    placeholder="Write a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="min-h-[36px] resize-none text-sm"
                    rows={1}
                  />
                  <Button
                    size="icon"
                    onClick={handleComment}
                    disabled={!commentText.trim() || isSubmitting}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Comments list */}
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={comment.author.image || ""} />
                    <AvatarFallback className="text-xs">
                      {getInitials(comment.author.fullName || comment.author.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="rounded-lg bg-orthodox-dark/50 px-3 py-2">
                      <span className="text-xs font-semibold text-orthodox-parchment">
                        {comment.author.fullName || comment.author.name}
                      </span>
                      <p className="text-sm text-orthodox-parchment/70 mt-0.5">
                        {comment.content}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 mt-1 ml-2">
                      <p className="text-xs text-orthodox-parchment/30">
                        {formatDate(comment.createdAt)}
                      </p>
                      <button
                        onClick={() => setReplyingTo({ id: comment.id, authorName: comment.author.fullName || comment.author.name || "User" })}
                        className="flex items-center gap-1 text-xs text-orthodox-parchment/40 hover:text-orthodox-gold transition-colors"
                      >
                        <Reply className="h-3 w-3" />
                        Reply
                      </button>
                    </div>

                    {/* Reply input */}
                    {replyingTo?.id === comment.id && (
                      <div className="flex gap-2 mt-2 ml-4">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={session?.user?.image || ""} />
                          <AvatarFallback className="text-xs">
                            {getInitials(session?.user?.fullName || session?.user?.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 flex gap-2">
                          <Textarea
                            placeholder={`Reply to ${replyingTo.authorName}...`}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            className="min-h-[32px] resize-none text-xs"
                            rows={1}
                          />
                          <div className="flex flex-col gap-1">
                            <Button
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleReply(comment.id)}
                              disabled={!replyText.trim() || isSubmitting}
                            >
                              <Send className="h-3 w-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-xs"
                              onClick={() => { setReplyingTo(null); setReplyText(""); }}
                            >
                              &times;
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Nested replies */}
                    {comment.replies?.map((reply) => (
                      <div key={reply.id} className="flex gap-2 mt-2 ml-4">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={reply.author.image || ""} />
                          <AvatarFallback className="text-xs">
                            {getInitials(reply.author.fullName || reply.author.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="rounded-lg bg-orthodox-dark/30 px-3 py-2">
                            <span className="text-xs font-semibold text-orthodox-parchment">
                              {reply.author.fullName || reply.author.name}
                            </span>
                            <p className="text-sm text-orthodox-parchment/70 mt-0.5">
                              {reply.content}
                            </p>
                          </div>
                          <p className="text-xs text-orthodox-parchment/30 mt-1 ml-2">
                            {formatDate(reply.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {comments.length === 0 && (
                <p className="text-center text-sm text-orthodox-parchment/30 py-2">
                  No comments yet. Be the first to comment!
                </p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
