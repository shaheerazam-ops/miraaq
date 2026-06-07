"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";
import type { ProductWithDetails } from "@/types";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(q)}&limit=6`);
      const data = await res.json();
      setResults(data.data?.products ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  const handleSelect = (slug: string) => {
    onOpenChange(false);
    setQuery("");
    router.push(`/shop/${slug}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-obsidian-900 border-obsidian-700">
        <DialogHeader>
          <DialogTitle className="font-display tracking-widest">Search Fragrances</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-obsidian-400" />
          <Input
            placeholder="Search by name, notes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
            autoFocus
          />
        </div>
        <div className="max-h-80 overflow-y-auto">
          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gold-400" />
            </div>
          )}
          {!loading && results.length === 0 && query.length >= 2 && (
            <p className="text-center text-obsidian-400 py-8 text-sm">No fragrances found</p>
          )}
          {results.map((product) => (
            <button
              key={product.id}
              onClick={() => handleSelect(product.slug)}
              className="w-full flex items-center gap-3 p-3 rounded-md hover:bg-obsidian-800 transition-colors text-left"
            >
              <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0">
                <Image
                  src={product.thumbnail}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ivory-100 truncate">{product.name}</p>
                <p className="text-xs text-obsidian-400">{product.volume}</p>
              </div>
              <span className="text-sm text-gold-400">{formatPrice(product.price)}</span>
            </button>
          ))}
          {query.length >= 2 && results.length > 0 && (
            <Link
              href={`/shop?search=${encodeURIComponent(query)}`}
              onClick={() => onOpenChange(false)}
              className="block text-center text-sm text-gold-400 hover:text-gold-300 py-3 border-t border-obsidian-700 mt-2"
            >
              View all results
            </Link>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
