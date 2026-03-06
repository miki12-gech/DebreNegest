"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, MessageCircle, Cross, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

const mobileNavItems = [
  { href: "/feed", label: "Feed", icon: Home },
  { href: "/classes", label: "ክፍልታት", icon: BookOpen },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/theology", label: "Fathers", icon: Cross },
  { href: "/notifications", label: "Alerts", icon: Bell },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-orthodox-gold/10 bg-orthodox-darker/95 backdrop-blur-lg">
      <div className="flex items-center justify-around py-2">
        {mobileNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors",
                isActive
                  ? "text-orthodox-gold"
                  : "text-orthodox-parchment/40 hover:text-orthodox-parchment/60"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
