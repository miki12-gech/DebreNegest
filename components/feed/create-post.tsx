"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Send, Crown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getInitials } from "@/lib/utils";
import { toast } from "sonner";

interface ClassOption {
  id: string;
  name: string;
}

interface CreatePostProps {
  classId?: string;
  onPostCreated?: () => void;
}

export function CreatePost({ classId, onPostCreated }: CreatePostProps) {
  const { data: session } = useSession();
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [selectedClassId, setSelectedClassId] = useState(classId || "");
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTitle, setShowTitle] = useState(false);
  const isClassLeader = session?.user?.role === "CLASS_ADMIN";
  const [myAdminClassName, setMyAdminClassName] = useState<string | null>(null);

  useEffect(() => {
    if (!classId) {
      fetch("/api/classes")
        .then((res) => res.json())
        .then((data) => {
          setClasses(data);
          // If class leader, find their administered class
          if (isClassLeader && session?.user?.id) {
            for (const cls of data) {
              if (cls.admins?.some((a: { user: { id: string } }) => a.user.id === session.user.id)) {
                setMyAdminClassName(cls.name);
                setSelectedClassId(cls.id);
                break;
              }
            }
          }
        })
        .catch(console.error);
    }
  }, [classId, isClassLeader, session?.user?.id]);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || null,
          content,
          classId: classId || selectedClassId || null,
        }),
      });

      if (res.ok) {
        setContent("");
        setTitle("");
        toast.success("Post created!");
        onPostCreated?.();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to create post");
      }
    } catch {
      toast.error("Failed to create post");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!session?.user) return null;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={session.user.image || ""} />
            <AvatarFallback>{getInitials(session.user.fullName || session.user.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-3">
            {showTitle && (
              <Input
                placeholder="Post title (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-sm"
              />
            )}
            <Textarea
              placeholder="Share something with the community..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[80px] resize-none text-sm"
              rows={3}
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTitle(!showTitle)}
                  className="text-xs"
                >
                  {showTitle ? "Hide Title" : "Add Title"}
                </Button>
                {!classId && isClassLeader && myAdminClassName && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orthodox-burgundy/15 border border-orthodox-burgundy/20 text-xs text-orthodox-gold">
                    <Crown className="h-3.5 w-3.5" />
                    Posting to {myAdminClassName}
                  </span>
                )}
                {!classId && !isClassLeader && (
                  <Select
                    value={selectedClassId}
                    onValueChange={setSelectedClassId}
                  >
                    <SelectTrigger className="w-36 h-8 text-xs">
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No class</SelectItem>
                      {classes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <Button
                onClick={handleSubmit}
                disabled={!content.trim() || isSubmitting}
                size="sm"
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                Post
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
