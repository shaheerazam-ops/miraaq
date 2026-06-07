"use client";

import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import type { ApiResponse } from "@/types";

interface WishlistItem {
  id: string;
  createdAt: string;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    comparePrice: number | null;
    thumbnail: string;
    volume: string;
    inventory?: { quantity: number } | null;
  };
}

export default function WishlistPage() {
  const queryClient = useQueryClient();

  const { data: items, isLoading } = useQuery({
    queryKey: ["wishlist"],
    queryFn: async () => {
      const res = await fetch("/api/wishlist");
      const json: ApiResponse<WishlistItem[]> = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data ?? [];
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (productId: string) => {
      const res = await fetch(`/api/wishlist/${productId}`, { method: "DELETE" });
      const json: ApiResponse = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success("Removed from wishlist");
    },
    onError: () => toast.error("Failed to remove item"),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl text-ivory-100">Wishlist</h1>
        <p className="mt-1 font-body text-obsidian-400">Your saved fragrances</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Saved Items ({items?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 animate-pulse rounded-md bg-obsidian-800" />
              ))}
            </div>
          ) : items && items.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map(({ id, product }) => (
                <div
                  key={id}
                  className="group overflow-hidden rounded-lg border border-obsidian-800 transition-all hover:border-gold-500/30"
                >
                  <Link href={`/shop/${product.slug}`} className="block">
                    <div className="relative aspect-square overflow-hidden bg-obsidian-900">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={product.thumbnail}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  </Link>
                  <div className="p-4">
                    <Link href={`/shop/${product.slug}`}>
                      <h3 className="font-heading text-lg text-ivory-100 hover:text-gold-400">
                        {product.name}
                      </h3>
                    </Link>
                    <p className="font-body text-sm text-obsidian-400">{product.volume}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <p className="font-heading text-gold-400">{formatPrice(product.price)}</p>
                      {product.comparePrice && (
                        <p className="font-body text-sm text-obsidian-500 line-through">
                          {formatPrice(product.comparePrice)}
                        </p>
                      )}
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Link href={`/shop/${product.slug}`} className="flex-1">
                        <Button variant="luxury" size="sm" className="w-full gap-1">
                          <ShoppingBag className="h-4 w-4" />
                          View
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeMutation.mutate(product.id)}
                        disabled={removeMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <Heart className="mx-auto h-12 w-12 text-obsidian-600" />
              <p className="mt-4 font-body text-obsidian-400">Your wishlist is empty</p>
              <Link href="/shop">
                <Button variant="luxury" className="mt-4">
                  Discover Fragrances
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
