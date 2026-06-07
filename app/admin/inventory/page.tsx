"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Warehouse, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { ApiResponse } from "@/types";

interface InventoryItem {
  id: string;
  quantity: number;
  lowStockThreshold: number;
  updatedAt: string;
  product: {
    id: string;
    name: string;
    sku: string;
    slug: string;
    thumbnail: string;
    active: boolean;
  };
}

export default function AdminInventoryPage() {
  const queryClient = useQueryClient();
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState("");

  const { data: inventory, isLoading } = useQuery({
    queryKey: ["admin-inventory", lowStockOnly],
    queryFn: async () => {
      const params = lowStockOnly ? "?lowStock=true" : "";
      const res = await fetch(`/api/admin/inventory${params}`);
      const json: ApiResponse<InventoryItem[]> = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data ?? [];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const res = await fetch(`/api/admin/inventory/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      const json: ApiResponse = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-inventory"] });
      setEditingId(null);
      toast.success("Inventory updated");
    },
    onError: () => toast.error("Failed to update inventory"),
  });

  const lowStockCount = inventory?.filter((i) => i.quantity <= i.lowStockThreshold).length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl text-ivory-100">Inventory</h1>
          <p className="mt-1 font-body text-obsidian-400">Track and manage stock levels</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={lowStockOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setLowStockOnly(!lowStockOnly)}
            className="gap-2"
          >
            <AlertTriangle className="h-4 w-4" />
            Low Stock ({lowStockCount})
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Warehouse className="h-5 w-5" />
            Stock Levels ({inventory?.length ?? 0})
          </CardTitle>
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
                  <th className="pb-3 pr-4 font-medium">Quantity</th>
                  <th className="pb-3 pr-4 font-medium">Threshold</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {inventory?.map((item) => {
                  const isLow = item.quantity <= item.lowStockThreshold;
                  return (
                    <tr key={item.id} className="border-b border-obsidian-800/50">
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-3">
                          {item.product.thumbnail && (
                            <div className="h-10 w-10 overflow-hidden rounded border border-obsidian-700">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={item.product.thumbnail}
                                alt={item.product.name}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          )}
                          <span className="font-medium text-ivory-100">{item.product.name}</span>
                        </div>
                      </td>
                      <td className="py-4 pr-4 text-obsidian-400">{item.product.sku}</td>
                      <td className="py-4 pr-4">
                        {editingId === item.id ? (
                          <Input
                            type="number"
                            className="w-24"
                            value={editQuantity}
                            onChange={(e) => setEditQuantity(e.target.value)}
                          />
                        ) : (
                          <span className={isLow ? "font-medium text-red-400" : "text-ivory-100"}>
                            {item.quantity}
                          </span>
                        )}
                      </td>
                      <td className="py-4 pr-4 text-obsidian-400">{item.lowStockThreshold}</td>
                      <td className="py-4 pr-4">
                        {isLow ? (
                          <Badge variant="destructive">Low Stock</Badge>
                        ) : item.quantity === 0 ? (
                          <Badge variant="destructive">Out of Stock</Badge>
                        ) : (
                          <Badge variant="emerald">In Stock</Badge>
                        )}
                      </td>
                      <td className="py-4">
                        {editingId === item.id ? (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="luxury"
                              disabled={updateMutation.isPending}
                              onClick={() =>
                                updateMutation.mutate({
                                  id: item.id,
                                  quantity: parseInt(editQuantity, 10),
                                })
                              }
                            >
                              {updateMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Save"
                              )}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingId(item.id);
                              setEditQuantity(String(item.quantity));
                            }}
                          >
                            Edit
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {!isLoading && inventory?.length === 0 && (
            <p className="py-8 text-center font-body text-obsidian-400">No inventory records</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
