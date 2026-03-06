"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { MessageCircle, Loader2, Search, Plus, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDate, getInitials } from "@/lib/utils";
import { toast } from "sonner";

interface ConversationMember {
  user: {
    id: string;
    fullName: string | null;
    name: string | null;
    image: string | null;
  };
}

interface Conversation {
  id: string;
  type: string;
  createdAt: string;
  members: ConversationMember[];
  messages: {
    id: string;
    content: string;
    createdAt: string;
    sender: {
      id: string;
      fullName: string | null;
      name: string | null;
    };
  }[];
  class: { id: string; name: string } | null;
}

export default function ChatPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/chat")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setConversations(data);
        }
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load conversations");
        setLoading(false);
      });
  }, []);

  const getConversationName = (conv: Conversation) => {
    if (conv.type === "CLASS" && conv.class) {
      return conv.class.name;
    }
    const otherMember = conv.members.find(
      (m) => m.user.id !== session?.user?.id
    );
    return otherMember?.user.fullName || otherMember?.user.name || "Unknown";
  };

  const getConversationImage = (conv: Conversation) => {
    if (conv.type === "CLASS") return null;
    const otherMember = conv.members.find(
      (m) => m.user.id !== session?.user?.id
    );
    return otherMember?.user.image || null;
  };

  const filteredConversations = conversations.filter((conv) =>
    getConversationName(conv).toLowerCase().includes(search.toLowerCase())
  );

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
            <MessageCircle className="h-6 w-6 text-orthodox-gold" />
            Messages
          </h1>
          <p className="text-orthodox-parchment/50 text-sm mt-1">
            Your conversations
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-orthodox-parchment/40" />
        <Input
          placeholder="Search conversations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredConversations.length === 0 ? (
        <div className="text-center py-16">
          <MessageCircle className="h-12 w-12 text-orthodox-parchment/20 mx-auto mb-4" />
          <p className="text-orthodox-parchment/40 text-lg">No conversations yet</p>
          <p className="text-orthodox-parchment/30 text-sm mt-1">
            Start a conversation with a community member
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredConversations.map((conv) => {
            const lastMessage = conv.messages[0];
            const name = getConversationName(conv);
            const image = getConversationImage(conv);

            return (
              <Card
                key={conv.id}
                className="cursor-pointer hover:border-orthodox-gold/20 transition-all"
                onClick={() => router.push(`/chat/${conv.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={image || ""} />
                      <AvatarFallback>
                        {conv.type === "CLASS" ? (
                          <Users className="h-5 w-5" />
                        ) : (
                          getInitials(name)
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-orthodox-parchment truncate">
                            {name}
                          </span>
                          {conv.type === "CLASS" && (
                            <Badge variant="outline" className="text-xs">Group</Badge>
                          )}
                        </div>
                        {lastMessage && (
                          <span className="text-xs text-orthodox-parchment/30">
                            {formatDate(lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      {lastMessage && (
                        <p className="text-sm text-orthodox-parchment/50 truncate mt-0.5">
                          <span className="font-medium">
                            {lastMessage.sender.id === session?.user?.id
                              ? "You"
                              : lastMessage.sender.fullName || lastMessage.sender.name}
                            :
                          </span>{" "}
                          {lastMessage.content}
                        </p>
                      )}
                    </div>
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
