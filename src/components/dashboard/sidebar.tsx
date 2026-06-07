"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Package,
  Heart,
  MapPin,
  Settings,
  LogOut,
  ChevronLeft,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { appConfig } from "@/lib/env";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/orders", label: "Orders", icon: Package },
  { href: "/dashboard/wishlist", label: "Wishlist", icon: Heart },
  { href: "/dashboard/addresses", label: "Addresses", icon: MapPin },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <aside className="flex h-full w-64 flex-col border-r border-obsidian-800 bg-obsidian-950">
      <div className="border-b border-obsidian-800 p-6">
        <Link href="/" className="group flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-gold-500 transition-transform group-hover:rotate-12" />
          <span className="font-display text-sm tracking-[0.2em] text-gold-400">
            {appConfig.name}
          </span>
        </Link>
        <p className="mt-1 font-body text-xs text-obsidian-400">Member Portal</p>
      </div>

      {session?.user && (
        <div className="border-b border-obsidian-800 px-6 py-4">
          <p className="font-heading text-sm text-ivory-100">{session.user.name ?? "Member"}</p>
          <p className="truncate font-body text-xs text-obsidian-400">{session.user.email}</p>
        </div>
      )}

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map(({ href, label, icon: Icon, exact }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2.5 font-body text-sm transition-all duration-200",
              isActive(href, exact)
                ? "bg-gold-500/10 text-gold-400 border border-gold-500/20"
                : "text-obsidian-300 hover:bg-obsidian-900 hover:text-ivory-100"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="space-y-2 border-t border-obsidian-800 p-4">
        <Link
          href="/shop"
          className="flex items-center gap-2 px-3 py-2 font-body text-xs text-obsidian-400 transition-colors hover:text-gold-400"
        >
          <ChevronLeft className="h-3 w-3" />
          Continue Shopping
        </Link>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-obsidian-400 hover:text-red-400"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
