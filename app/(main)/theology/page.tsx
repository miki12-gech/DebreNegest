"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  Cross,
  Send,
  Loader2,
  Plus,
  MessageSquare,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn, formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface TheologyMessage {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

interface TheologyConversation {
  id: string;
  title: string | null;
  createdAt: string;
  messages: TheologyMessage[];
}

export default function TheologyPage() {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<TheologyConversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<TheologyMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/theology")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setConversations(data);
        }
        setLoadingConversations(false);
      })
      .catch(() => setLoadingConversations(false));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleAsk = async () => {
    if (!question.trim() || loading) return;

    const userMessage: TheologyMessage = {
      id: `temp-${Date.now()}`,
      role: "USER",
      content: question,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuestion("");
    setLoading(true);

    try {
      const res = await fetch("/api/theology", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userMessage.content,
          conversationId: currentConversationId,
        }),
      });

      const data = await res.json();

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setCurrentConversationId(data.conversationId);
      setMessages((prev) => [...prev, data.message]);

      // Refresh conversation list
      fetch("/api/theology")
        .then((res) => res.json())
        .then((convData) => {
          if (Array.isArray(convData)) {
            setConversations(convData);
          }
        });
    } catch {
      toast.error("Failed to get answer. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const startNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-10rem)]">
        {/* Sidebar - conversation history */}
        <div className="lg:w-72 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-orthodox-parchment flex items-center gap-2">
              <Cross className="h-5 w-5 text-orthodox-gold" />
              Ask the Fathers
            </h2>
            <Button variant="ghost" size="icon" onClick={startNewConversation}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-1 max-h-64 lg:max-h-full overflow-y-auto">
            {loadingConversations ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-orthodox-gold" />
              </div>
            ) : conversations.length === 0 ? (
              <p className="text-sm text-orthodox-parchment/30 text-center py-4">
                No conversations yet
              </p>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={async () => {
                    setCurrentConversationId(conv.id);
                    // Lazy-load messages for this conversation
                    try {
                      const res = await fetch(`/api/theology/${conv.id}`);
                      const data = await res.json();
                      if (Array.isArray(data)) {
                        setMessages(data);
                      }
                    } catch {
                      toast.error("Failed to load conversation");
                    }
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                    currentConversationId === conv.id
                      ? "bg-orthodox-gold/15 text-orthodox-gold"
                      : "text-orthodox-parchment/60 hover:bg-orthodox-gold/5"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{conv.title || "New conversation"}</span>
                  </div>
                  <p className="text-xs text-orthodox-parchment/30 mt-0.5 ml-6">
                    {formatDate(conv.createdAt)}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        <Separator orientation="vertical" className="hidden lg:block" />

        {/* Main chat area */}
        <div className="flex-1 flex flex-col">
          {messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4 max-w-md">
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-orthodox-gold/10 border border-orthodox-gold/20 mx-auto">
                  <BookOpen className="h-8 w-8 text-orthodox-gold" />
                </div>
                <h2 className="text-xl font-semibold text-orthodox-parchment">
                  Ask the Church Fathers
                </h2>
                <p className="text-sm text-orthodox-parchment/50 leading-relaxed">
                  Ask any theological or spiritual question and receive answers
                  grounded in Orthodox teachings, Holy Scripture, and the
                  writings of the Church Fathers.
                </p>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  {[
                    "What is the significance of fasting in Orthodox tradition?",
                    "Explain the Holy Trinity in Orthodox theology",
                    "What do the Church Fathers say about prayer?",
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setQuestion(suggestion)}
                      className="text-left px-4 py-3 rounded-lg border border-orthodox-gold/10 bg-orthodox-dark/30 text-orthodox-parchment/60 hover:bg-orthodox-gold/5 hover:text-orthodox-gold transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-4 py-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-3",
                    msg.role === "USER" ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  {msg.role === "ASSISTANT" ? (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="bg-orthodox-gold/20 text-orthodox-gold">
                        <Cross className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  ) : null}
                  <div
                    className={cn(
                      "max-w-2xl rounded-2xl px-4 py-3",
                      msg.role === "USER"
                        ? "bg-orthodox-gold text-orthodox-dark rounded-br-md"
                        : "bg-orthodox-dark/80 text-orthodox-parchment rounded-bl-md border border-orthodox-gold/10"
                    )}
                  >
                    <div
                      className={cn(
                        "text-sm whitespace-pre-wrap leading-relaxed",
                        msg.role === "ASSISTANT" && "prose-sm"
                      )}
                    >
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-orthodox-gold/20 text-orthodox-gold">
                      <Cross className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-orthodox-dark/80 rounded-2xl rounded-bl-md border border-orthodox-gold/10 px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-orthodox-parchment/50">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Consulting the Fathers...
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Input area */}
          <div className="border-t border-orthodox-gold/10 pt-4 flex gap-2">
            <Textarea
              placeholder="Ask a theological question..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              className="min-h-[44px] resize-none"
              rows={1}
            />
            <Button
              onClick={handleAsk}
              disabled={!question.trim() || loading}
              size="icon"
              className="flex-shrink-0 h-11 w-11"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
