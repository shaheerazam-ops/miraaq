"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  Search,
  ShoppingBag,
  Heart,
  User,
  Menu,
  LogOut,
  LayoutDashboard,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useCartStore } from "@/lib/store/cart-store";
import { useUIStore } from "@/lib/store/cart-store";
import { cn } from "@/lib/utils";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { SearchDialog } from "@/components/layout/search-dialog";

const navLinks = [
  { href: "/shop", label: "Shop" },
  { href: "/shop?category=oud-collection", label: "Oud Collection" },
  { href: "/shop?newArrival=true", label: "New Arrivals" },
  { href: "/about", label: "Our Story" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const { data: session } = useSession();
  const itemCount = useCartStore((s) => s.getItemCount());
  const { isCartOpen, setCartOpen, isSearchOpen, setSearchOpen } = useUIStore();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          scrolled
            ? "bg-obsidian-950/95 backdrop-blur-md border-b border-obsidian-800/50 shadow-luxury"
            : "bg-transparent"
        )}
      >
        <div className="container-luxury">
          <div className="flex h-16 md:h-20 items-center justify-between gap-4">
            <Link href="/" className="flex-shrink-0 group">
              <span className="font-display text-xl md:text-2xl tracking-[0.2em] text-gold-400 group-hover:text-gold-300 transition-colors">
                MIRAAQ
              </span>
              <span className="font-arabic text-sm md:text-base text-emerald-500 ml-1">عود</span>
            </Link>

            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="font-body text-sm tracking-wider uppercase text-ivory-200/80 hover:text-gold-400 transition-colors relative group"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-px bg-gold-400 transition-all group-hover:w-full" />
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2 md:gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchOpen(true)}
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </Button>

              <Link href="/dashboard/wishlist" className="hidden sm:flex">
                <Button variant="ghost" size="icon" aria-label="Wishlist">
                  <Heart className="h-5 w-5" />
                </Button>
              </Link>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCartOpen(true)}
                className="relative"
                aria-label="Cart"
              >
                <ShoppingBag className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-gold-500 text-obsidian-950 text-2xs font-bold flex items-center justify-center">
                    {itemCount > 9 ? "9+" : itemCount}
                  </span>
                )}
              </Button>

              {session ? (
                <div className="hidden sm:flex items-center gap-1">
                  <Link href="/dashboard">
                    <Button variant="ghost" size="icon" aria-label="Account">
                      <User className="h-5 w-5" />
                    </Button>
                  </Link>
                  {session.user.role === "ADMIN" && (
                    <Link href="/admin">
                      <Button variant="ghost" size="icon" aria-label="Admin">
                        <Shield className="h-4 w-4 text-gold-400" />
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <Link href="/login" className="hidden sm:block">
                  <Button variant="outline" size="sm">
                    Sign In
                  </Button>
                </Link>
              )}

              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild className="lg:hidden">
                  <Button variant="ghost" size="icon" aria-label="Menu">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <nav className="flex flex-col gap-6 mt-8">
                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className="font-heading text-xl text-ivory-100 hover:text-gold-400 transition-colors"
                      >
                        {link.label}
                      </Link>
                    ))}
                    <hr className="border-obsidian-700" />
                    {session ? (
                      <>
                        <Link
                          href="/dashboard"
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-2 text-ivory-200 hover:text-gold-400"
                        >
                          <LayoutDashboard className="h-4 w-4" />
                          Dashboard
                        </Link>
                        <button
                          onClick={() => signOut({ callbackUrl: "/" })}
                          className="flex items-center gap-2 text-ivory-200 hover:text-gold-400"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign Out
                        </button>
                      </>
                    ) : (
                      <Link href="/login" onClick={() => setMobileOpen(false)}>
                        <Button variant="luxury" className="w-full">
                          Sign In
                        </Button>
                      </Link>
                    )}
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      <CartDrawer open={isCartOpen} onOpenChange={setCartOpen} />
      <SearchDialog open={isSearchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
