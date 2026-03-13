"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Users, BookOpen, Trash2, Loader2 } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { toast } from "sonner";

interface ClassInfo {
  classId: string;
  class: { id: string; name: string };
}

interface ClassMember {
  id: string;
  userId: string;
  classId: string;
  joinedAt: string;
  user: {
    id: string;
    fullName: string | null;
    name: string | null;
    email: string | null;
    image: string | null;
    role: string;
  };
}

export default function ClassLeaderPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [adminClasses, setAdminClasses] = useState<ClassInfo[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [members, setMembers] = useState<ClassMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user || session.user.role !== "CLASS_ADMIN") {
      router.push("/feed");
      return;
    }

    // Fetch user's administered classes
    fetch("/api/classes")
      .then((res) => res.json())
      .then((classes) => {
        if (!Array.isArray(classes)) return;
        // Filter to classes where this user is an admin
        const myClasses = classes.filter((cls: { admins: { userId: string }[] }) =>
          cls.admins?.some((a: { userId: string }) => a.userId === session.user.id)
        );
        const classInfos = myClasses.map((cls: { id: string; name: string }) => ({
          classId: cls.id,
          class: { id: cls.id, name: cls.name },
        }));
        setAdminClasses(classInfos);
        if (classInfos.length > 0) {
          setSelectedClassId(classInfos[0].classId);
        }
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load classes");
        setLoading(false);
      });
  }, [session, status]);

  useEffect(() => {
    if (!selectedClassId) return;
    setLoadingMembers(true);
    fetch(`/api/admin/class-members?classId=${selectedClassId}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setMembers(data);
        }
        setLoadingMembers(false);
      })
      .catch(() => {
        toast.error("Failed to load members");
        setLoadingMembers(false);
      });
  }, [selectedClassId]);

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Remove this member from the class?")) return;
    try {
      const res = await fetch(`/api/admin/class-members?memberId=${memberId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
        toast.success("Member removed");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to remove member");
      }
    } catch {
      toast.error("Failed to remove member");
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-orthodox-gold" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-6 w-6 text-orthodox-gold" />
        <h1 className="text-2xl font-bold text-orthodox-parchment">My Class Dashboard</h1>
      </div>

      {adminClasses.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="h-12 w-12 text-orthodox-parchment/30 mx-auto mb-4" />
            <p className="text-orthodox-parchment/60">You are not assigned as a leader for any class.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Class selector */}
          {adminClasses.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {adminClasses.map((cls) => (
                <Button
                  key={cls.classId}
                  variant={selectedClassId === cls.classId ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedClassId(cls.classId)}
                >
                  {cls.class.name}
                </Button>
              ))}
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {adminClasses.find((c) => c.classId === selectedClassId)?.class.name} - Members
                <Badge variant="secondary" className="ml-2">{members.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingMembers ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-orthodox-gold" />
                </div>
              ) : members.length === 0 ? (
                <p className="text-center py-8 text-orthodox-parchment/40">No members in this class yet.</p>
              ) : (
                <div className="space-y-3">
                  {members.map((member) => (
                    <div key={member.id}>
                      <div className="flex items-center gap-3 py-2">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.user.image || ""} />
                          <AvatarFallback>
                            {getInitials(member.user.fullName || member.user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-orthodox-parchment truncate">
                            {member.user.fullName || member.user.name}
                          </p>
                          <p className="text-xs text-orthodox-parchment/40 truncate">
                            {member.user.email}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {member.user.role}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <Separator />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
