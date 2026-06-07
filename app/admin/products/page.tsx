"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import type { ApiResponse } from "@/types";

interface AdminProduct {
  id: string;
  name: string;
  sku: string;
  slug: string;
  price: number;
  active: boolean;
  featured: boolean;
  bestSeller: boolean;
  category: { name: string };
  inventory?: { quantity: number } | null;
}

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: products, isLoading } = useQuery({
    queryKey: ["admin-products", search],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "50" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/products?${params}`);
      const json: ApiResponse<AdminProduct[]> = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data ?? [];
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      const json: ApiResponse = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Product updated");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      const json: ApiResponse = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Product deactivated");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl text-ivory-100">Products</h1>
          <p className="mt-1 font-body text-obsidian-400">Manage your fragrance catalog</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-obsidian-500" />
          <Input
            placeholder="Search products..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Catalog ({products?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <div className="h-64 animate-pulse rounded bg-obsidian-800" />
          ) : (
            <table className="w-full min-w-[800px] font-body text-sm">
              <thead>
                <tr className="border-b border-obsidian-800 text-left text-obsidian-400">
                  <th className="pb-3 pr-4 font-medium">Product</th>
                  <th className="pb-3 pr-4 font-medium">SKU</th>
                  <th className="pb-3 pr-4 font-medium">Category</th>
                  <th className="pb-3 pr-4 font-medium">Price</th>
                  <th className="pb-3 pr-4 font-medium">Stock</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products?.map((product) => (
                  <tr key={product.id} className="border-b border-obsidian-800/50">
                    <td className="py-4 pr-4">
                      <p className="font-medium text-ivory-100">{product.name}</p>
                      <div className="mt-1 flex gap-1">
                        {product.featured && <Badge variant="default">Featured</Badge>}
                        {product.bestSeller && <Badge variant="emerald">Best Seller</Badge>}
                      </div>
                    </td>
                    <td className="py-4 pr-4 text-obsidian-400">{product.sku}</td>
                    <td className="py-4 pr-4 text-obsidian-400">{product.category.name}</td>
                    <td className="py-4 pr-4 text-gold-400">{formatPrice(product.price)}</td>
                    <td className="py-4 pr-4">
                      <span
                        className={
                          (product.inventory?.quantity ?? 0) <= 10
                            ? "text-red-400"
                            : "text-ivory-100"
                        }
                      >
                        {product.inventory?.quantity ?? 0}
                      </span>
                    </td>
                    <td className="py-4 pr-4">
                      <Badge variant={product.active ? "emerald" : "secondary"}>
                        {product.active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="py-4">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            toggleMutation.mutate({ id: product.id, active: !product.active })
                          }
                          title={product.active ? "Deactivate" : "Activate"}
                        >
                          {product.active ? (
                            <ToggleRight className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 text-obsidian-500" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-400"
                          onClick={() => deleteMutation.mutate(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!isLoading && products?.length === 0 && (
            <p className="py-8 text-center font-body text-obsidian-400">No products found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
