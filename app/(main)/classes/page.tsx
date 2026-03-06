"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BookOpen, Users, FileText, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface ClassItem {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  _count: { posts: number; admins: number };
  admins: {
    user: {
      id: string;
      fullName: string | null;
      name: string | null;
      image: string | null;
    };
  }[];
}

const classIcons: Record<string, string> = {
  "መዝሙር": "🎵",
  "ትምህርቲ": "📖",
  "ኪነጥበብ": "🎨",
  "አባላት ጉዳይ": "👥",
  "ኦዲት እና ኢንስፔክሽን": "📋",
  "ልምዓት": "🌱",
};

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/classes")
      .then((res) => res.json())
      .then((data) => {
        setClasses(data);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load classes");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-orthodox-gold" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-orthodox-parchment flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-orthodox-gold" />
          Church Classes (ክፍልታት)
        </h1>
        <p className="text-orthodox-parchment/50 mt-1">
          Explore and engage with content from different church departments
        </p>
      </div>

      {classes.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="h-12 w-12 text-orthodox-parchment/20 mx-auto mb-4" />
          <p className="text-orthodox-parchment/40 text-lg">No classes yet</p>
          <p className="text-orthodox-parchment/30 text-sm mt-1">
            Classes will appear here once created by an administrator
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {classes.map((classItem) => (
            <Link key={classItem.id} href={`/classes/${classItem.id}`}>
              <Card className="h-full hover:border-orthodox-gold/20 transition-all duration-200 cursor-pointer group">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg group-hover:text-orthodox-gold transition-colors">
                      <span className="mr-2">{classIcons[classItem.name] || "📚"}</span>
                      {classItem.name}
                    </CardTitle>
                  </div>
                  {classItem.description && (
                    <CardDescription className="mt-1">
                      {classItem.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-orthodox-parchment/40">
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      <span>{classItem._count.posts} posts</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{classItem._count.admins} admin{classItem._count.admins !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
