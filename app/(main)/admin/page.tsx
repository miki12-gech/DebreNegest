"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Shield,
  Users,
  BookOpen,
  Loader2,
  Plus,
  Trash2,
  Crown,
  Search,
  Globe,
  Send,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getInitials, formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface UserItem {
  id: string;
  fullName: string | null;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  createdAt: string;
  _count: { posts: number; comments: number };
  classesAdministered: { class: { id: string; name: string } }[];
  classMemberships: { class: { id: string; name: string } }[];
}

interface ClassItem {
  id: string;
  name: string;
  description: string | null;
  _count: { posts: number; admins: number; members: number };
  admins: {
    user: {
      id: string;
      fullName: string | null;
      name: string | null;
      image: string | null;
    };
  }[];
}

interface ClassMemberItem {
  user: {
    id: string;
    fullName: string | null;
    name: string | null;
    email: string;
    image: string | null;
    role: string;
  };
}

const classIcons: Record<string, string> = {
  "\u1218\u12dd\u1219\u122d": "\u{1F3B5}",
  "\u1275\u121D\u1205\u122D\u1272": "\u{1F4D6}",
  "\u12AA\u1290\u1325\u1260\u1265": "\u{1F3A8}",
  "\u12A0\u1263\u120B\u1275 \u1309\u12F3\u12ED": "\u{1F465}",
  "\u12A6\u12F2\u1275 \u12A5\u1293 \u12A2\u1295\u1235\u1354\u12AD\u123D\u1295": "\u{1F4CB}",
  "\u120D\u121D\u12D3\u1275": "\u{1F331}",
};

export default function AdminPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newClassName, setNewClassName] = useState("");
  const [newClassDescription, setNewClassDescription] = useState("");
  const [creatingClass, setCreatingClass] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClassForLeader, setSelectedClassForLeader] = useState("");
  const [assigningLeader, setAssigningLeader] = useState(false);
  const [selectedClassView, setSelectedClassView] = useState<string | null>(null);
  const [classMembers, setClassMembers] = useState<ClassMemberItem[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [postTitle, setPostTitle] = useState("");
  const [postClassId, setPostClassId] = useState("global");
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    if (session?.user?.role !== "SUPER_ADMIN") {
      router.push("/feed");
      return;
    }
    Promise.all([
      fetch("/api/admin/users").then((r) => r.json()),
      fetch("/api/classes").then((r) => r.json()),
    ])
      .then(([usersData, classesData]) => {
        if (Array.isArray(usersData)) setUsers(usersData);
        if (Array.isArray(classesData)) setClasses(classesData);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load admin data");
        setLoading(false);
      });
  }, [session, router]);

  const refreshData = async () => {
    const [usersRes, classesRes] = await Promise.all([
      fetch("/api/admin/users"),
      fetch("/api/classes"),
    ]);
    const [usersData, classesData] = await Promise.all([
      usersRes.json(),
      classesRes.json(),
    ]);
    if (Array.isArray(usersData)) setUsers(usersData);
    if (Array.isArray(classesData)) setClasses(classesData);
  };

  const assignClassLeader = async (userId: string) => {
    if (!selectedClassForLeader) {
      toast.error("Please select a class first");
      return;
    }
    setAssigningLeader(true);
    try {
      const res = await fetch("/api/admin/class-leaders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, classId: selectedClassForLeader }),
      });
      if (res.ok) {
        await refreshData();
        toast.success("Class leader assigned successfully!");
        setSelectedClassForLeader("");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to assign");
      }
    } catch {
      toast.error("Failed to assign class leader");
    } finally {
      setAssigningLeader(false);
    }
  };

  const removeClassLeader = async (userId: string, classId: string) => {
    try {
      const res = await fetch(
        `/api/admin/class-leaders?userId=${userId}&classId=${classId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        await refreshData();
        toast.success("Class leader removed");
      }
    } catch {
      toast.error("Failed to remove class leader");
    }
  };

  const createClass = async () => {
    if (!newClassName.trim()) return;
    setCreatingClass(true);
    try {
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newClassName, description: newClassDescription || null }),
      });
      if (res.ok) {
        const newClass = await res.json();
        setClasses((prev) => [...prev, newClass]);
        setNewClassName("");
        setNewClassDescription("");
        toast.success("Class created successfully");
      }
    } catch {
      toast.error("Failed to create class");
    } finally {
      setCreatingClass(false);
    }
  };

  const deleteClass = async (classId: string) => {
    try {
      const res = await fetch(`/api/admin/classes?classId=${classId}`, { method: "DELETE" });
      if (res.ok) {
        setClasses((prev) => prev.filter((c) => c.id !== classId));
        toast.success("Class deleted");
      }
    } catch {
      toast.error("Failed to delete class");
    }
  };

  const loadClassMembers = async (classId: string) => {
    setLoadingMembers(true);
    setSelectedClassView(classId);
    try {
      const res = await fetch(`/api/admin/class-members?classId=${classId}`);
      const data = await res.json();
      if (Array.isArray(data)) setClassMembers(data);
    } catch {
      toast.error("Failed to load members");
    } finally {
      setLoadingMembers(false);
    }
  };

  const handlePost = async () => {
    if (!postContent.trim()) return;
    setIsPosting(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: postTitle || null,
          content: postContent,
          classId: postClassId === "global" ? null : postClassId,
          isGlobal: postClassId === "global",
        }),
      });
      if (res.ok) {
        setPostContent("");
        setPostTitle("");
        setPostClassId("global");
        toast.success(
          postClassId === "global"
            ? "Posted globally to all members!"
            : "Posted to class successfully!"
        );
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

  const filteredUsers = users.filter((u) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (u.fullName || "").toLowerCase().includes(q) ||
      (u.name || "").toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-orthodox-gold/20 animate-spin border-t-orthodox-gold" />
          <Shield className="h-6 w-6 text-orthodox-gold absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="text-orthodox-parchment/50 text-sm animate-pulse">
          Loading admin panel...
        </p>
      </div>
    );
  }

  const roleBadgeColor = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-gradient-to-r from-orthodox-gold/20 to-orthodox-gold/10 text-orthodox-gold border-orthodox-gold/30";
      case "CLASS_ADMIN":
        return "bg-gradient-to-r from-orthodox-burgundy/20 to-orthodox-burgundy/10 text-orthodox-parchment border-orthodox-burgundy/30";
      default:
        return "bg-orthodox-dark/50 text-orthodox-parchment/60 border-orthodox-gold/10";
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-orthodox-gold/20 bg-gradient-to-br from-orthodox-dark via-orthodox-darker to-orthodox-dark p-6 md:p-8">
        <div className="absolute inset-0 bg-gradient-to-r from-orthodox-gold/5 to-transparent" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-orthodox-gold/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-orthodox-gold/20 to-orthodox-gold/5 border border-orthodox-gold/20 animate-pulse-gold">
            <Shield className="h-7 w-7 text-orthodox-gold" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-orthodox-parchment">
              Admin Command Center
            </h1>
            <p className="text-orthodox-parchment/50 text-sm mt-1">
              Manage classes, assign leaders, and oversee the community
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: "Total Users", value: users.length, icon: Users, color: "from-blue-500/20 to-blue-500/5" },
          { label: "Classes", value: classes.length, icon: BookOpen, color: "from-orthodox-gold/20 to-orthodox-gold/5" },
          { label: "Class Leaders", value: users.filter((u) => u.role === "CLASS_ADMIN").length, icon: Crown, color: "from-orthodox-burgundy/20 to-orthodox-burgundy/5" },
          { label: "Total Posts", value: users.reduce((sum, u) => sum + u._count.posts, 0), icon: Send, color: "from-green-500/20 to-green-500/5" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="group relative overflow-hidden rounded-xl border border-orthodox-gold/10 bg-orthodox-dark/50 p-4 hover:border-orthodox-gold/20 transition-all duration-300 hover:scale-[1.02]"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
            <div className="relative">
              <stat.icon className="h-5 w-5 text-orthodox-gold/60 mb-2" />
              <p className="text-2xl font-bold text-orthodox-gold">{stat.value}</p>
              <p className="text-xs text-orthodox-parchment/50 mt-0.5">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="classes" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 bg-orthodox-dark/50 border border-orthodox-gold/10 rounded-xl p-1">
          <TabsTrigger
            value="classes"
            className="gap-2 data-[state=active]:bg-orthodox-gold/15 data-[state=active]:text-orthodox-gold rounded-lg transition-all duration-200"
          >
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Classes</span>
          </TabsTrigger>
          <TabsTrigger
            value="users"
            className="gap-2 data-[state=active]:bg-orthodox-gold/15 data-[state=active]:text-orthodox-gold rounded-lg transition-all duration-200"
          >
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger
            value="post"
            className="gap-2 data-[state=active]:bg-orthodox-gold/15 data-[state=active]:text-orthodox-gold rounded-lg transition-all duration-200"
          >
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Post</span>
          </TabsTrigger>
        </TabsList>

        {/* CLASSES TAB */}
        <TabsContent value="classes" className="mt-4 space-y-4 animate-slide-up">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((cls, index) => (
              <div
                key={cls.id}
                className="group relative overflow-hidden rounded-xl border border-orthodox-gold/10 bg-gradient-to-br from-orthodox-dark/80 to-orthodox-darker hover:border-orthodox-gold/25 transition-all duration-300 hover:shadow-lg hover:shadow-orthodox-gold/5"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-orthodox-gold/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-orthodox-gold/10 transition-colors duration-300" />
                <div className="relative p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{classIcons[cls.name] || "\u{1F4DA}"}</span>
                      <div>
                        <h3 className="font-bold text-orthodox-parchment group-hover:text-orthodox-gold transition-colors">
                          {cls.name}
                        </h3>
                        {cls.description && (
                          <p className="text-xs text-orthodox-parchment/40 mt-0.5 line-clamp-1">
                            {cls.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-orthodox-red/50 hover:text-orthodox-red hover:bg-orthodox-red/10 opacity-0 group-hover:opacity-100 transition-all"
                      onClick={() => deleteClass(cls.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-orthodox-parchment/50 mb-4">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {cls._count.members} members
                    </span>
                    <span className="flex items-center gap-1">
                      <Send className="h-3.5 w-3.5" />
                      {cls._count.posts} posts
                    </span>
                  </div>

                  {/* Class Leaders */}
                  <div className="mb-3">
                    <p className="text-xs font-medium text-orthodox-gold/70 mb-2 flex items-center gap-1">
                      <Crown className="h-3 w-3" />
                      Class Leaders
                    </p>
                    {cls.admins.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {cls.admins.map((admin) => (
                          <div
                            key={admin.user.id}
                            className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-orthodox-burgundy/15 border border-orthodox-burgundy/20 text-xs"
                          >
                            <Avatar className="h-4 w-4">
                              <AvatarImage src={admin.user.image || ""} />
                              <AvatarFallback className="text-[8px]">
                                {getInitials(admin.user.fullName || admin.user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-orthodox-parchment/70">
                              {admin.user.fullName || admin.user.name || "Unnamed"}
                            </span>
                            <button
                              onClick={() => removeClassLeader(admin.user.id, cls.id)}
                              className="text-orthodox-red/50 hover:text-orthodox-red ml-1 transition-colors"
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-orthodox-parchment/30 italic">
                        No leader assigned
                      </p>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs gap-1.5 text-orthodox-gold/60 hover:text-orthodox-gold hover:bg-orthodox-gold/10"
                    onClick={() => loadClassMembers(cls.id)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View Members
                  </Button>
                </div>
              </div>
            ))}

            {/* Create New Class Card */}
            <Dialog>
              <DialogTrigger asChild>
                <div className="flex flex-col items-center justify-center min-h-[200px] rounded-xl border-2 border-dashed border-orthodox-gold/15 bg-orthodox-dark/20 cursor-pointer hover:border-orthodox-gold/30 hover:bg-orthodox-dark/40 transition-all duration-300 group">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-orthodox-gold/10 group-hover:bg-orthodox-gold/20 group-hover:scale-110 transition-all duration-300 mb-3">
                    <Plus className="h-6 w-6 text-orthodox-gold/60 group-hover:text-orthodox-gold" />
                  </div>
                  <p className="text-sm font-medium text-orthodox-parchment/50 group-hover:text-orthodox-parchment/70">
                    Create New Class
                  </p>
                </div>
              </DialogTrigger>
              <DialogContent className="bg-orthodox-darker border-orthodox-gold/20">
                <DialogHeader>
                  <DialogTitle className="text-orthodox-parchment flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-orthodox-gold" />
                    Create New Class
                  </DialogTitle>
                  <DialogDescription className="text-orthodox-parchment/50">
                    Add a new church department/class
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <Input
                    placeholder="Class name"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                  />
                  <Textarea
                    placeholder="Description (optional)"
                    value={newClassDescription}
                    onChange={(e) => setNewClassDescription(e.target.value)}
                    rows={3}
                  />
                  <Button
                    onClick={createClass}
                    disabled={!newClassName.trim() || creatingClass}
                    className="w-full gap-2"
                  >
                    {creatingClass ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    Create Class
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Class Members Viewer */}
          {selectedClassView && (
            <Card className="animate-slide-up border-orthodox-gold/15 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-orthodox-gold/5 to-transparent">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-orthodox-gold" />
                    Members of{" "}
                    {classes.find((c) => c.id === selectedClassView)?.name}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedClassView(null)}
                    className="text-orthodox-parchment/40"
                  >
                    Close
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {loadingMembers ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-orthodox-gold" />
                  </div>
                ) : classMembers.length === 0 ? (
                  <p className="text-center text-sm text-orthodox-parchment/30 py-8">
                    No members in this class yet
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {classMembers.map((member) => (
                      <div
                        key={member.user.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-orthodox-dark/30 border border-orthodox-gold/5 hover:border-orthodox-gold/15 transition-all duration-200"
                      >
                        <Avatar className="h-9 w-9">
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
                        <Badge className={`text-xs ${roleBadgeColor(member.user.role)}`}>
                          {member.user.role === "CLASS_ADMIN" ? "Leader" : "Member"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* USERS TAB */}
        <TabsContent value="users" className="mt-4 space-y-4 animate-slide-up">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-orthodox-parchment/40" />
            <Input
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Card className="border-orthodox-gold/10 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-orthodox-gold/5 to-transparent pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-orthodox-gold" />
                User Management
                <Badge variant="outline" className="ml-2 text-xs">
                  {filteredUsers.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-4">
              {filteredUsers.map((user, index) => (
                <div
                  key={user.id}
                  className="group flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl bg-orthodox-dark/20 border border-orthodox-gold/5 hover:border-orthodox-gold/15 hover:bg-orthodox-dark/40 transition-all duration-200"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar className="h-10 w-10 ring-2 ring-orthodox-gold/10">
                      <AvatarImage src={user.image || ""} />
                      <AvatarFallback>
                        {getInitials(user.fullName || user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-orthodox-parchment truncate">
                          {user.fullName || user.name || "No name"}
                        </span>
                        <Badge className={`text-xs ${roleBadgeColor(user.role)}`}>
                          {user.role === "SUPER_ADMIN"
                            ? "Super Admin"
                            : user.role === "CLASS_ADMIN"
                              ? "Class Leader"
                              : "Member"}
                        </Badge>
                      </div>
                      <p className="text-xs text-orthodox-parchment/40 truncate">
                        {user.email}
                      </p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-xs text-orthodox-parchment/30">
                          {user._count.posts} posts
                        </span>
                        <span className="text-xs text-orthodox-parchment/30">
                          Joined {formatDate(user.createdAt)}
                        </span>
                        {user.classMemberships.length > 0 && (
                          <span className="text-xs text-orthodox-gold/50 flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            {user.classMemberships
                              .map((m) => m.class.name)
                              .join(", ")}
                          </span>
                        )}
                        {user.classesAdministered.length > 0 && (
                          <span className="text-xs text-orthodox-burgundy flex items-center gap-1">
                            <Crown className="h-3 w-3" />
                            Leads:{" "}
                            {user.classesAdministered
                              .map((a) => a.class.name)
                              .join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Assign as Class Leader */}
                  {user.role !== "SUPER_ADMIN" && (
                    <div className="flex items-center gap-2 sm:ml-auto">
                      <Select
                        value={selectedClassForLeader}
                        onValueChange={setSelectedClassForLeader}
                      >
                        <SelectTrigger className="w-32 h-8 text-xs">
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                          {classes.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {classIcons[c.name] || "\u{1F4DA}"} {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs gap-1.5 border-orthodox-gold/20 text-orthodox-gold hover:bg-orthodox-gold/10"
                        onClick={() => assignClassLeader(user.id)}
                        disabled={assigningLeader}
                      >
                        {assigningLeader ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Crown className="h-3.5 w-3.5" />
                        )}
                        Assign Leader
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* POST TAB - Super Admin Posting */}
        <TabsContent value="post" className="mt-4 animate-slide-up">
          <Card className="border-orthodox-gold/15 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-orthodox-gold/5 to-transparent">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Globe className="h-5 w-5 text-orthodox-gold" />
                Create Post
              </CardTitle>
              <p className="text-xs text-orthodox-parchment/50 mt-1">
                Post globally to all members or to a specific class
              </p>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {/* Target Selection */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setPostClassId("global")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    postClassId === "global"
                      ? "bg-orthodox-gold/20 text-orthodox-gold border border-orthodox-gold/30 shadow-sm shadow-orthodox-gold/10"
                      : "bg-orthodox-dark/30 text-orthodox-parchment/50 border border-orthodox-gold/10 hover:border-orthodox-gold/20"
                  }`}
                >
                  <Globe className="h-4 w-4" />
                  Global (All Members)
                </button>
                {classes.map((cls) => (
                  <button
                    key={cls.id}
                    onClick={() => setPostClassId(cls.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      postClassId === cls.id
                        ? "bg-orthodox-gold/20 text-orthodox-gold border border-orthodox-gold/30 shadow-sm shadow-orthodox-gold/10"
                        : "bg-orthodox-dark/30 text-orthodox-parchment/50 border border-orthodox-gold/10 hover:border-orthodox-gold/20"
                    }`}
                  >
                    <span>{classIcons[cls.name] || "\u{1F4DA}"}</span>
                    {cls.name}
                  </button>
                ))}
              </div>

              <Input
                placeholder="Post title (optional)"
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
              />
              <Textarea
                placeholder="Write your message to the community..."
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
                {postClassId === "global"
                  ? "Post to All Members"
                  : `Post to ${classes.find((c) => c.id === postClassId)?.name || "Class"}`}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
