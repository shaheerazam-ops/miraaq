"use client";

import { useRouter, useSearchParams } from "next/navigation";

const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name-asc", label: "Name: A-Z" },
  { value: "name-desc", label: "Name: Z-A" },
];

interface ShopToolbarProps {
  total: number;
  currentSort?: string;
  currentPage: number;
  totalPages: number;
}

export function ShopToolbar({ total, currentSort = "newest", currentPage, totalPages }: ShopToolbarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSort = (sort: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", sort);
    params.delete("page");
    router.push(`/shop?${params.toString()}`);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-obsidian-800">
      <p className="text-sm text-obsidian-400">
        Showing page {currentPage} of {totalPages} ({total} products)
      </p>
      <div className="flex items-center gap-2">
        <label htmlFor="sort" className="text-sm text-obsidian-400">
          Sort by:
        </label>
        <select
          id="sort"
          value={currentSort}
          onChange={(e) => handleSort(e.target.value)}
          className="bg-obsidian-800 border border-obsidian-700 rounded-md px-3 py-1.5 text-sm text-ivory-100 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
