"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

const MINIMAL_LAYOUT_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/verify-email",
  "/dashboard",
  "/admin",
];

function usesMinimalLayout(pathname: string) {
  return MINIMAL_LAYOUT_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const minimal = usesMinimalLayout(pathname);

  if (minimal) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
