"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  slug: string;
}

const genders = [
  { value: "MEN", label: "Men" },
  { value: "WOMEN", label: "Women" },
  { value: "UNISEX", label: "Unisex" },
];

const families = [
  "ORIENTAL", "WOODY", "FLORAL", "FRESH", "SPICY", "CITRUS", "AMBER", "OUD", "MUSK",
];

const volumes = ["50ml", "75ml", "100ml", "4 x 15ml"];

interface ShopFiltersProps {
  categories: Category[];
  currentFilters: Record<string, string | undefined>;
}

export function ShopFilters({ categories, currentFilters }: ShopFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      params.delete("page");
      router.push(`/shop?${params.toString()}`);
    },
    [router, searchParams]
  );

  const clearFilters = () => router.push("/shop");

  return (
    <div className="space-y-6 luxury-card p-5 sticky top-24">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg text-gold-400">Filters</h2>
        <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
          Clear All
        </Button>
      </div>

      <div>
        <Label className="text-xs uppercase tracking-wider mb-3 block">Category</Label>
        <div className="space-y-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() =>
                updateFilter("category", currentFilters.category === cat.slug ? null : cat.slug)
              }
              className={cn(
                "w-full text-left px-3 py-2 rounded text-sm transition-colors",
                currentFilters.category === cat.slug
                  ? "bg-gold-500/10 text-gold-400 border border-gold-500/30"
                  : "text-obsidian-300 hover:text-ivory-100 hover:bg-obsidian-800"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-xs uppercase tracking-wider mb-3 block">Gender</Label>
        <div className="flex flex-wrap gap-2">
          {genders.map((g) => (
            <button
              key={g.value}
              onClick={() =>
                updateFilter("gender", currentFilters.gender === g.value ? null : g.value)
              }
              className={cn(
                "px-3 py-1 rounded-full text-xs border transition-colors",
                currentFilters.gender === g.value
                  ? "border-gold-500 text-gold-400 bg-gold-500/10"
                  : "border-obsidian-600 text-obsidian-400 hover:border-obsidian-500"
              )}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-xs uppercase tracking-wider mb-3 block">Fragrance Family</Label>
        <div className="flex flex-wrap gap-2">
          {families.map((f) => (
            <button
              key={f}
              onClick={() =>
                updateFilter("fragranceFamily", currentFilters.fragranceFamily === f ? null : f)
              }
              className={cn(
                "px-3 py-1 rounded-full text-xs border transition-colors capitalize",
                currentFilters.fragranceFamily === f
                  ? "border-gold-500 text-gold-400 bg-gold-500/10"
                  : "border-obsidian-600 text-obsidian-400 hover:border-obsidian-500"
              )}
            >
              {f.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-xs uppercase tracking-wider mb-3 block">Volume</Label>
        <div className="flex flex-wrap gap-2">
          {volumes.map((v) => (
            <button
              key={v}
              onClick={() => updateFilter("volume", currentFilters.volume === v ? null : v)}
              className={cn(
                "px-3 py-1 rounded-full text-xs border transition-colors",
                currentFilters.volume === v
                  ? "border-gold-500 text-gold-400 bg-gold-500/10"
                  : "border-obsidian-600 text-obsidian-400 hover:border-obsidian-500"
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-xs uppercase tracking-wider mb-3 block">Price Range</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Min"
            defaultValue={currentFilters.minPrice}
            onBlur={(e) => updateFilter("minPrice", e.target.value || null)}
            className="text-sm"
          />
          <Input
            type="number"
            placeholder="Max"
            defaultValue={currentFilters.maxPrice}
            onBlur={(e) => updateFilter("maxPrice", e.target.value || null)}
            className="text-sm"
          />
        </div>
      </div>
    </div>
  );
}
