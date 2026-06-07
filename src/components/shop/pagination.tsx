"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ShopPaginationProps {
  currentPage: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
}

export function ShopPagination({ currentPage, totalPages, searchParams }: ShopPaginationProps) {
  const buildUrl = (page: number) => {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value && key !== "page") params.set(key, value);
    });
    if (page > 1) params.set("page", page.toString());
    const qs = params.toString();
    return `/shop${qs ? `?${qs}` : ""}`;
  };

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1
  );

  return (
    <nav className="flex items-center justify-center gap-2 mt-10" aria-label="Pagination">
      {currentPage > 1 && (
        <Button variant="outline" size="icon" asChild>
          <Link href={buildUrl(currentPage - 1)} aria-label="Previous page">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
      )}

      {pages.map((page, i) => {
        const prevPage = pages[i - 1];
        const showEllipsis = prevPage && page - prevPage > 1;
        return (
          <span key={page} className="flex items-center gap-2">
            {showEllipsis && <span className="text-obsidian-500">…</span>}
            <Link
              href={buildUrl(page)}
              className={cn(
                "w-9 h-9 rounded-md flex items-center justify-center text-sm transition-colors",
                page === currentPage
                  ? "bg-gold-500 text-obsidian-950 font-medium"
                  : "text-obsidian-400 hover:bg-obsidian-800 hover:text-ivory-100"
              )}
            >
              {page}
            </Link>
          </span>
        );
      })}

      {currentPage < totalPages && (
        <Button variant="outline" size="icon" asChild>
          <Link href={buildUrl(currentPage + 1)} aria-label="Next page">
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      )}
    </nav>
  );
}
