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
import { Separator } from "@/components/ui/separator";
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
}

interface ClassItem {
  id: string;
  name: string;
  description: string | null;
  _count: { posts: number; admins: number };
}

export default function AdminPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newClassName, setNewClassName] = useState("");
  const [newClassDescription, setNewClassDescription] = useState("");
  const [creatingClass, setCreatingClass] = useState(false);

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

  const updateUserRole = async (userId: string, role: string) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });

      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role } : u))
        );
        toast.success("Role updated successfully");
      }
    } catch {
      toast.error("Failed to update role");
    }
  };

  const createClass = async () => {
    if (!newClassName.trim()) return;
    setCreatingClass(true);
    try {
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newClassName,
          description: newClassDescription || null,
        }),
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
      const res = await fetch(`/api/admin/classes?classId=${classId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setClasses((prev) => prev.filter((c) => c.id !== classId));
        toast.success("Class deleted");
      }
    } catch {
      toast.error("Failed to delete class");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-orthodox-gold" />
      </div>
    );
  }

  const roleBadgeVariant = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN": return "default" as const;
      case "CLASS_ADMIN": return "secondary" as const;
      default: return "outline" as const;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-orthodox-parchment flex items-center gap-2">
          <Shield className="h-6 w-6 text-orthodox-gold" />
          Admin Panel
        </h1>
        <p className="text-orthodox-parchment/50 text-sm mt-1">
          Manage users, classes, and platform settings
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orthodox-gold">{users.length}</p>
            <p className="text-xs text-orthodox-parchment/50">Total Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orthodox-gold">{classes.length}</p>
            <p className="text-xs text-orthodox-parchment/50">Classes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orthodox-gold">
              {users.filter((u) => u.role === "SUPER_ADMIN").length}
            </p>
            <p className="text-xs text-orthodox-parchment/50">Admins</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orthodox-gold">
              {users.reduce((sum, u) => sum + u._count.posts, 0)}
            </p>
            <p className="text-xs text-orthodox-parchment/50">Total Posts</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="classes" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Classes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-orthodox-dark/30"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.image || ""} />
                    <AvatarFallback>
                      {getInitials(user.fullName || user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-orthodox-parchment truncate">
                        {user.fullName || user.name || "No name"}
                      </span>
                      <Badge variant={roleBadgeVariant(user.role)} className="text-xs">
                        {user.role}
                      </Badge>
                    </div>
                    <p className="text-xs text-orthodox-parchment/40 truncate">
                      {user.email} · {user._count.posts} posts · Joined {formatDate(user.createdAt)}
                    </p>
                  </div>
                  <Select
                    value={user.role}
                    onValueChange={(value) => updateUserRole(user.id, value)}
                  >
                    <SelectTrigger className="w-36 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MEMBER">Member</SelectItem>
                      <SelectItem value="CLASS_ADMIN">Class Admin</SelectItem>
                      <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classes" className="mt-4 space-y-4">
          {/* Create class */}
          <Card>
            <CardHeader>
              <CardTitle>Create New Class</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Class name (e.g., መዝሙር)"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
              />
              <Textarea
                placeholder="Description (optional)"
                value={newClassDescription}
                onChange={(e) => setNewClassDescription(e.target.value)}
                rows={2}
              />
              <Button
                onClick={createClass}
                disabled={!newClassName.trim() || creatingClass}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Class
              </Button>
            </CardContent>
          </Card>

          {/* Class list */}
          <Card>
            <CardHeader>
              <CardTitle>Existing Classes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {classes.length === 0 ? (
                <p className="text-center text-sm text-orthodox-parchment/30 py-4">
                  No classes created yet
                </p>
              ) : (
                classes.map((cls) => (
                  <div
                    key={cls.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-orthodox-dark/30"
                  >
                    <div>
                      <span className="font-medium text-sm text-orthodox-parchment">
                        {cls.name}
                      </span>
                      {cls.description && (
                        <p className="text-xs text-orthodox-parchment/40 mt-0.5">
                          {cls.description}
                        </p>
                      )}
                      <p className="text-xs text-orthodox-parchment/30 mt-1">
                        {cls._count.posts} posts · {cls._count.admins} admins
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-orthodox-red hover:text-orthodox-red"
                      onClick={() => deleteClass(cls.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
