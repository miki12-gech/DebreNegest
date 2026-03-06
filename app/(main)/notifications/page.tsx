"use client";

import { useState, useEffect } from "react";
import { Bell, Check, CheckCheck, Loader2, Heart, MessageCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface Notification {
  id: string;
  type: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

const typeIcons: Record<string, typeof Heart> = {
  LIKE: Heart,
  COMMENT: MessageCircle,
  NEW_POST: FileText,
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setNotifications(data);
        }
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load notifications");
        setLoading(false);
      });
  }, []);

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark notifications as read");
    }
  };

  const markRead = async (notificationId: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
    } catch {
      toast.error("Failed to mark notification as read");
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-orthodox-gold" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-orthodox-parchment flex items-center gap-2">
            <Bell className="h-6 w-6 text-orthodox-gold" />
            Notifications
          </h1>
          {unreadCount > 0 && (
            <p className="text-orthodox-parchment/50 text-sm mt-1">
              {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead} className="gap-2">
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16">
          <Bell className="h-12 w-12 text-orthodox-parchment/20 mx-auto mb-4" />
          <p className="text-orthodox-parchment/40 text-lg">No notifications yet</p>
          <p className="text-orthodox-parchment/30 text-sm mt-1">
            You&apos;ll be notified about important activities
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const Icon = typeIcons[notification.type] || Bell;
            return (
              <Card
                key={notification.id}
                className={cn(
                  "transition-all",
                  !notification.isRead && "border-orthodox-gold/20 bg-orthodox-gold/5"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "flex items-center justify-center w-9 h-9 rounded-full flex-shrink-0",
                        notification.type === "LIKE"
                          ? "bg-orthodox-red/20 text-orthodox-red"
                          : notification.type === "COMMENT"
                          ? "bg-orthodox-gold/20 text-orthodox-gold"
                          : "bg-orthodox-green/20 text-orthodox-green"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-orthodox-parchment">
                        {notification.message}
                      </p>
                      <p className="text-xs text-orthodox-parchment/30 mt-1">
                        {formatDate(notification.createdAt)}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => markRead(notification.id)}
                        className="flex-shrink-0"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
