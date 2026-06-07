"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  FolderTree,
  Ticket,
  Warehouse,
  Star,
  LogOut,
  Shield,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { appConfig } from "@/lib/env";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/admin", label: "Analytics", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products", icon: ShoppingBag },
  { href: "/admin/orders", label: "Orders", icon: Package },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/coupons", label: "Coupons", icon: Ticket },
  { href: "/admin/inventory", label: "Inventory", icon: Warehouse },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
];

export function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <aside className="flex h-full w-64 flex-col border-r border-obsidian-800 bg-obsidian-950">
      <div className="border-b border-obsidian-800 p-6">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-gold-500" />
          <span className="font-display text-sm tracking-[0.2em] text-gold-400">Admin</span>
        </div>
        <p className="mt-1 font-body text-xs text-obsidian-400">{appConfig.name} Console</p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navItems.map(({ href, label, icon: Icon, exact }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2.5 font-body text-sm transition-all duration-200",
              isActive(href, exact)
                ? "border border-gold-500/20 bg-gold-500/10 text-gold-400"
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
          href="/"
          className="flex items-center gap-2 px-3 py-2 font-body text-xs text-obsidian-400 transition-colors hover:text-gold-400"
        >
          <ChevronLeft className="h-3 w-3" />
          Back to Store
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
