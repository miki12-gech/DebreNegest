"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Crown,
  Users,
  Send,
  Loader2,
  BookOpen,
  UserPlus,
  UserMinus,
  MessageSquare,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getInitials } from "@/lib/utils";
import { toast } from "sonner";

interface ClassInfo {
  id: string;
  name: string;
  description: string | null;
}

interface MemberItem {
  id: string;
  user: {
    id: string;
    fullName: string | null;
    name: string | null;
    email: string;
    image: string | null;
    role: string;
  };
}

interface PostItem {
  id: string;
  title: string | null;
  content: string;
  createdAt: string;
  author: {
    fullName: string | null;
    name: string | null;
    image: string | null;
  };
  _count: { comments: number; likes: number };
}

const classIcons: Record<string, string> = {
  "\u1218\u12dd\u1219\u122d": "\u{1F3B5}",
  "\u1275\u121D\u1205\u122D\u1272": "\u{1F4D6}",
  "\u12AA\u1290\u1325\u1260\u1265": "\u{1F3A8}",
  "\u12A0\u1263\u120B\u1275 \u1309\u12F3\u12ED": "\u{1F465}",
  "\u12A6\u12F2\u1275 \u12A5\u1293 \u12A2\u1295\u1235\u1354\u12AD\u123D\u1295": "\u{1F4CB}",
  "\u120D\u121D\u12D3\u1275": "\u{1F331}",
};

export default function ClassLeaderDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [myClass, setMyClass] = useState<ClassInfo | null>(null);
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [postContent, setPostContent] = useState("");
  const [postTitle, setPostTitle] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [addMemberEmail, setAddMemberEmail] = useState("");
  const [addingMember, setAddingMember] = useState(false);

  useEffect(() => {
    if (!session?.user) return;
    if (session.user.role !== "CLASS_ADMIN") {
      router.push("/feed");
      return;
    }

    // Fetch the class this leader administers
    fetch("/api/classes")
      .then((r) => r.json())
      .then(async (classes) => {
        // Find the class this user administers
        for (const cls of classes) {
          if (cls.admins?.some((a: { user: { id: string } }) => a.user.id === session.user.id)) {
            setMyClass({ id: cls.id, name: cls.name, description: cls.description });
            // Load members and posts
            const [membersRes, postsRes] = await Promise.all([
              fetch(`/api/admin/class-members?classId=${cls.id}`),
              fetch(`/api/posts?classId=${cls.id}`),
            ]);
            const membersData = await membersRes.json();
            const postsData = await postsRes.json();
            if (Array.isArray(membersData)) setMembers(membersData);
            if (Array.isArray(postsData)) setPosts(postsData);
            else if (postsData.posts) setPosts(postsData.posts);
            break;
          }
        }
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load dashboard");
        setLoading(false);
      });
  }, [session, router]);

  const refreshMembers = async () => {
    if (!myClass) return;
    const res = await fetch(`/api/admin/class-members?classId=${myClass.id}`);
    const data = await res.json();
    if (Array.isArray(data)) setMembers(data);
  };

  const refreshPosts = async () => {
    if (!myClass) return;
    const res = await fetch(`/api/posts?classId=${myClass.id}`);
    const data = await res.json();
    if (Array.isArray(data)) setPosts(data);
    else if (data.posts) setPosts(data.posts);
  };

  const handlePost = async () => {
    if (!postContent.trim() || !myClass) return;
    setIsPosting(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: postTitle || null,
          content: postContent,
          classId: myClass.id,
        }),
      });
      if (res.ok) {
        setPostContent("");
        setPostTitle("");
        toast.success("Posted to your class!");
        await refreshPosts();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to post");
      }
    } catch {
      toast.error("Failed to create post");
    } finally {
      setIsPosting(false);
    }
  };

  const removeMember = async (userId: string) => {
    if (!myClass) return;
    try {
      const res = await fetch(
        `/api/admin/class-members?userId=${userId}&classId=${myClass.id}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        await refreshMembers();
        toast.success("Member removed from class");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to remove member");
      }
    } catch {
      toast.error("Failed to remove member");
    }
  };

  const addMember = async () => {
    if (!addMemberEmail.trim() || !myClass) return;
    setAddingMember(true);
    try {
      const res = await fetch("/api/admin/class-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: addMemberEmail, classId: myClass.id }),
      });
      if (res.ok) {
        setAddMemberEmail("");
        await refreshMembers();
        toast.success("Member added to class!");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to add member");
      }
    } catch {
      toast.error("Failed to add member");
    } finally {
      setAddingMember(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-orthodox-gold/20 animate-spin border-t-orthodox-gold" />
          <Crown className="h-6 w-6 text-orthodox-gold absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="text-orthodox-parchment/50 text-sm animate-pulse">
          Loading your dashboard...
        </p>
      </div>
    );
  }

  if (!myClass) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 animate-fade-in">
        <Crown className="h-12 w-12 text-orthodox-gold/30" />
        <h2 className="text-lg font-medium text-orthodox-parchment/60">
          No Class Assigned
        </h2>
        <p className="text-sm text-orthodox-parchment/40 text-center max-w-md">
          You haven&apos;t been assigned to manage any class yet. Please contact the Super Admin.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-orthodox-burgundy/30 bg-gradient-to-br from-orthodox-dark via-orthodox-darker to-orthodox-dark p-6 md:p-8">
        <div className="absolute inset-0 bg-gradient-to-r from-orthodox-burgundy/10 to-transparent" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-orthodox-burgundy/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-orthodox-burgundy/20 to-orthodox-gold/10 border border-orthodox-burgundy/20 animate-pulse-gold">
            <span className="text-3xl">{classIcons[myClass.name] || "\u{1F4DA}"}</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-bold text-orthodox-parchment">
                {myClass.name}
              </h1>
              <Badge className="bg-orthodox-burgundy/20 text-orthodox-gold border-orthodox-burgundy/30 text-xs">
                <Crown className="h-3 w-3 mr-1" />
                Class Leader
              </Badge>
            </div>
            {myClass.description && (
              <p className="text-orthodox-parchment/50 text-sm mt-1">
                {myClass.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-orthodox-gold">{members.length}</p>
              <p className="text-xs text-orthodox-parchment/40">Members</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orthodox-gold">{posts.length}</p>
              <p className="text-xs text-orthodox-parchment/40">Posts</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="members" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 bg-orthodox-dark/50 border border-orthodox-gold/10 rounded-xl p-1">
          <TabsTrigger
            value="members"
            className="gap-2 data-[state=active]:bg-orthodox-burgundy/20 data-[state=active]:text-orthodox-gold rounded-lg transition-all duration-200"
          >
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
          <TabsTrigger
            value="post"
            className="gap-2 data-[state=active]:bg-orthodox-burgundy/20 data-[state=active]:text-orthodox-gold rounded-lg transition-all duration-200"
          >
            <Send className="h-4 w-4" />
            Post
          </TabsTrigger>
        </TabsList>

        {/* MEMBERS TAB */}
        <TabsContent value="members" className="mt-4 space-y-4 animate-slide-up">
          {/* Add Member */}
          <Card className="border-orthodox-gold/10 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-orthodox-burgundy/5 to-transparent pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-orthodox-gold" />
                Add Member to Class
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Member email address..."
                  value={addMemberEmail}
                  onChange={(e) => setAddMemberEmail(e.target.value)}
                  className="flex-1"
                  onKeyDown={(e) => e.key === "Enter" && addMember()}
                />
                <Button
                  onClick={addMember}
                  disabled={!addMemberEmail.trim() || addingMember}
                  size="sm"
                  className="gap-1.5 px-4"
                >
                  {addingMember ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Members List */}
          <Card className="border-orthodox-gold/10 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-orthodox-gold/5 to-transparent pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-orthodox-gold" />
                Class Members
                <Badge variant="outline" className="ml-2 text-xs">
                  {members.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {members.length === 0 ? (
                <div className="text-center py-10">
                  <Users className="h-10 w-10 text-orthodox-gold/20 mx-auto mb-3" />
                  <p className="text-sm text-orthodox-parchment/40">
                    No members in your class yet
                  </p>
                  <p className="text-xs text-orthodox-parchment/30 mt-1">
                    Add members using their email above
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {members.map((member, index) => (
                    <div
                      key={member.id}
                      className="group flex items-center gap-3 p-3 rounded-xl bg-orthodox-dark/30 border border-orthodox-gold/5 hover:border-orthodox-gold/15 transition-all duration-200 hover:bg-orthodox-dark/50"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <Avatar className="h-10 w-10 ring-2 ring-orthodox-gold/10">
                        <AvatarImage src={member.user.image || ""} />
                        <AvatarFallback className="text-xs">
                          {getInitials(member.user.fullName || member.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-orthodox-parchment truncate">
                          {member.user.fullName || member.user.name || "Unnamed"}
                        </p>
                        <p className="text-xs text-orthodox-parchment/40 truncate">
                          {member.user.email}
                        </p>
                      </div>
                      {member.user.role === "CLASS_ADMIN" ? (
                        <Badge className="text-xs bg-orthodox-burgundy/20 text-orthodox-gold border-orthodox-burgundy/30">
                          Leader
                        </Badge>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-orthodox-red/40 hover:text-orthodox-red hover:bg-orthodox-red/10 opacity-0 group-hover:opacity-100 transition-all"
                          onClick={() => removeMember(member.user.id)}
                          title="Remove from class"
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* POST TAB */}
        <TabsContent value="post" className="mt-4 space-y-4 animate-slide-up">
          {/* Create Post */}
          <Card className="border-orthodox-gold/15 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-orthodox-burgundy/5 to-transparent">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Send className="h-5 w-5 text-orthodox-gold" />
                Post to {myClass.name}
              </CardTitle>
              <p className="text-xs text-orthodox-parchment/50 mt-1">
                Your post will be visible to all members of your class
              </p>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <Input
                placeholder="Post title (optional)"
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
              />
              <Textarea
                placeholder="Write a message to your class members..."
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                rows={5}
                className="resize-none"
              />
              <Button
                onClick={handlePost}
                disabled={!postContent.trim() || isPosting}
                className="w-full gap-2 h-11"
              >
                {isPosting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Post to {myClass.name}
              </Button>
            </CardContent>
          </Card>

          {/* Recent Posts */}
          <Card className="border-orthodox-gold/10 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-orthodox-gold/5 to-transparent pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="h-5 w-5 text-orthodox-gold" />
                Recent Class Posts
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {posts.length === 0 ? (
                <div className="text-center py-10">
                  <BookOpen className="h-10 w-10 text-orthodox-gold/20 mx-auto mb-3" />
                  <p className="text-sm text-orthodox-parchment/40">
                    No posts in your class yet
                  </p>
                  <p className="text-xs text-orthodox-parchment/30 mt-1">
                    Create the first post above!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {posts.map((post, index) => (
                    <div
                      key={post.id}
                      className="p-4 rounded-xl bg-orthodox-dark/30 border border-orthodox-gold/5 hover:border-orthodox-gold/15 transition-all duration-200"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={post.author.image || ""} />
                          <AvatarFallback className="text-xs">
                            {getInitials(post.author.fullName || post.author.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium text-orthodox-parchment/70">
                          {post.author.fullName || post.author.name}
                        </span>
                        <span className="text-xs text-orthodox-parchment/30 ml-auto">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {post.title && (
                        <h4 className="font-semibold text-sm text-orthodox-parchment mb-1">
                          {post.title}
                        </h4>
                      )}
                      <p className="text-sm text-orthodox-parchment/70 line-clamp-3">
                        {post.content}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-orthodox-parchment/30">
                        <span>{post._count.comments} comments</span>
                        <span>{post._count.likes} likes</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
