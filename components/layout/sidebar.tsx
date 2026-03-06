"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Home,
  BookOpen,
  MessageCircle,
  Bell,
  Settings,
  LogOut,
  Shield,
  Cross,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { href: "/feed", label: "Feed", icon: Home },
  { href: "/classes", label: "ክፍልታት", icon: BookOpen },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/theology", label: "Ask the Fathers", icon: Cross },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/profile", label: "Profile", icon: User },
];

const adminItems = [
  { href: "/admin", label: "Admin Panel", icon: Shield },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "SUPER_ADMIN";

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30">
      <div className="flex flex-col flex-grow bg-orthodox-darker border-r border-orthodox-gold/10 overflow-y-auto">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-orthodox-gold/10">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-orthodox-gold/10">
            <Cross className="h-6 w-6 text-orthodox-gold" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-orthodox-gold tracking-wide">
              ደብረ ነገስት
            </span>
            <span className="text-xs text-orthodox-parchment/50">
              ትምህርት ሰንበት
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-orthodox-gold/15 text-orthodox-gold shadow-sm"
                    : "text-orthodox-parchment/60 hover:text-orthodox-parchment hover:bg-orthodox-gold/5"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive && "text-orthodox-gold")} />
                {item.label}
                {item.href === "/notifications" && (
                  <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-orthodox-red text-xs text-white" id="notification-badge" style={{ display: "none" }}>
                    0
                  </span>
                )}
              </Link>
            );
          })}

          {isAdmin && (
            <>
              <Separator className="my-3" />
              {adminItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-orthodox-burgundy/30 text-orthodox-gold shadow-sm"
                        : "text-orthodox-parchment/60 hover:text-orthodox-parchment hover:bg-orthodox-burgundy/10"
                    )}
                  >
                    <item.icon className={cn("h-5 w-5", isActive && "text-orthodox-gold")} />
                    {item.label}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* User section */}
        {session?.user && (
          <div className="border-t border-orthodox-gold/10 p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src={session.user.image || ""} />
                <AvatarFallback>{getInitials(session.user.fullName || session.user.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-orthodox-parchment truncate">
                  {session.user.fullName || session.user.name}
                </p>
                <p className="text-xs text-orthodox-parchment/40 truncate">
                  {session.user.email}
                </p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="p-2 rounded-lg text-orthodox-parchment/40 hover:text-orthodox-red hover:bg-orthodox-red/10 transition-colors"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
