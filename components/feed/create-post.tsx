"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Send, ImagePlus, Globe, Pin, X } from "lucide-react";
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
import { UploadDropzone } from "@/lib/uploadthing";

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
  const [imageUrl, setImageUrl] = useState("");
  const [showImageUpload, setShowImageUpload] = useState(false);
  const isAdmin = session?.user?.role === "SUPER_ADMIN";
  const isClassAdmin = session?.user?.role === "CLASS_ADMIN";
  const canPost = isAdmin || isClassAdmin;

  useEffect(() => {
    if (!classId) {
      fetch("/api/classes")
        .then((res) => res.json())
        .then((data) => setClasses(data))
        .catch(console.error);
    }
  }, [classId]);

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
          image: imageUrl || null,
          classId: classId || selectedClassId || null,
        }),
      });

      if (res.ok) {
        setContent("");
        setTitle("");
        setImageUrl("");
        setShowImageUpload(false);
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
  if (!canPost) return null;

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
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowImageUpload(!showImageUpload)}
                  className="text-xs gap-1"
                >
                  <ImagePlus className="h-4 w-4" />
                  {showImageUpload ? "Hide Image" : "Add Photo"}
                </Button>
                {!classId && (
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

            {/* Image upload section */}
            {showImageUpload && (
              <div className="mt-3">
                {imageUrl ? (
                  <div className="relative inline-block">
                    <img
                      src={imageUrl}
                      alt="Upload preview"
                      className="rounded-lg max-h-48 object-cover border border-orthodox-gold/10"
                    />
                    <button
                      type="button"
                      onClick={() => setImageUrl("")}
                      className="absolute -top-2 -right-2 bg-orthodox-red text-white rounded-full p-1 hover:bg-orthodox-red/80 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <UploadDropzone
                    endpoint="imageUploader"
                    onClientUploadComplete={(res) => {
                      setImageUrl(res[0].url);
                      toast.success("Image uploaded!");
                    }}
                    onUploadError={(error: Error) => {
                      toast.error(`ERROR! ${error.message}`);
                    }}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
