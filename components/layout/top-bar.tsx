"use client";

import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Menu,
  Cross,
  LogOut,
  User,
  Shield,
  Settings,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInitials } from "@/lib/utils";
import { useState } from "react";

const pageTitles: Record<string, string> = {
  "/feed": "Feed",
  "/classes": "ክፍልታት (Classes)",
  "/chat": "Messages",
  "/theology": "Ask the Fathers",
  "/notifications": "Notifications",
  "/profile": "Profile",
  "/admin": "Admin Panel",
};

export function TopBar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const title = Object.entries(pageTitles).find(([key]) =>
    pathname.startsWith(key)
  )?.[1] || "ደብረ ነገስት";

  return (
    <header className="sticky top-0 z-40 border-b border-orthodox-gold/10 bg-orthodox-darker/95 backdrop-blur-lg">
      <div className="flex items-center justify-between h-14 px-4 md:px-6">
        {/* Mobile logo */}
        <div className="flex items-center gap-3 md:hidden">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-orthodox-gold/10">
            <Cross className="h-5 w-5 text-orthodox-gold" />
          </div>
          <span className="text-sm font-bold text-orthodox-gold">ደብረ ነገስት</span>
        </div>

        {/* Page title (desktop) */}
        <h1 className="hidden md:block text-lg font-semibold text-orthodox-parchment">
          {title}
        </h1>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {session?.user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-orthodox-gold/5 transition-colors">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session.user.image || ""} />
                    <AvatarFallback className="text-xs">
                      {getInitials(session.user.fullName || session.user.name)}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="text-sm">{session.user.fullName || session.user.name}</span>
                    <span className="text-xs font-normal text-orthodox-parchment/50">{session.user.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                {session.user.role === "SUPER_ADMIN" && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="cursor-pointer">
                      <Shield className="mr-2 h-4 w-4" />
                      Admin Panel
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-orthodox-red cursor-pointer"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
