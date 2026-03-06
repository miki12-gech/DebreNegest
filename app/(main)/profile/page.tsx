"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  User,
  Mail,
  Calendar,
  Edit,
  Save,
  Loader2,
  Lock,
  FileText,
  MessageCircle,
  Heart,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getInitials, formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface ProfileData {
  id: string;
  fullName: string | null;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  createdAt: string;
  _count: { posts: number; comments: number; likes: number };
}

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        setProfile(data);
        setFullName(data.fullName || data.name || "");
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load profile");
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const body: Record<string, string> = { fullName };
      if (currentPassword && newPassword) {
        body.currentPassword = currentPassword;
        body.newPassword = newPassword;
      }

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        setProfile((prev) => (prev ? { ...prev, ...data } : prev));
        setEditing(false);
        setCurrentPassword("");
        setNewPassword("");
        toast.success("Profile updated!");
        // Update session
        await update({ fullName });
      } else {
        toast.error(data.error || "Failed to update profile");
      }
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-orthodox-gold" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.image || ""} />
              <AvatarFallback className="text-xl">
                {getInitials(profile.fullName || profile.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-orthodox-parchment">
                  {profile.fullName || profile.name || "No name"}
                </h1>
                <Badge
                  variant={
                    profile.role === "SUPER_ADMIN"
                      ? "default"
                      : profile.role === "CLASS_ADMIN"
                      ? "secondary"
                      : "outline"
                  }
                >
                  {profile.role}
                </Badge>
              </div>
              <div className="flex items-center gap-1 mt-1 text-sm text-orthodox-parchment/50">
                <Mail className="h-3.5 w-3.5" />
                {profile.email}
              </div>
              <div className="flex items-center gap-1 mt-1 text-sm text-orthodox-parchment/40">
                <Calendar className="h-3.5 w-3.5" />
                Joined {formatDate(profile.createdAt)}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-orthodox-gold/10">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-orthodox-gold">
                <FileText className="h-4 w-4" />
                <span className="text-lg font-bold">{profile._count.posts}</span>
              </div>
              <p className="text-xs text-orthodox-parchment/40">Posts</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-orthodox-gold">
                <MessageCircle className="h-4 w-4" />
                <span className="text-lg font-bold">{profile._count.comments}</span>
              </div>
              <p className="text-xs text-orthodox-parchment/40">Comments</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-orthodox-gold">
                <Heart className="h-4 w-4" />
                <span className="text-lg font-bold">{profile._count.likes}</span>
              </div>
              <p className="text-xs text-orthodox-parchment/40">Likes</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit profile */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-orthodox-gold" />
            Edit Profile
          </CardTitle>
          {!editing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
              className="gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={!editing}
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={profile.email} disabled className="opacity-50" />
          </div>

          {editing && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Change Password
                </Label>
                <Input
                  type="password"
                  placeholder="Current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <Input
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="gap-2"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Changes
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEditing(false);
                    setFullName(profile.fullName || profile.name || "");
                    setCurrentPassword("");
                    setNewPassword("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
