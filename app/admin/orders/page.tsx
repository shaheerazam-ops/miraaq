"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatPrice } from "@/lib/utils";
import type { ApiResponse } from "@/types";

interface AdminOrder {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  user: { name: string | null; email: string };
  items: { name: string; quantity: number }[];
  payment?: { status: string } | null;
}

const STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;

const statusVariant: Record<string, "default" | "secondary" | "emerald" | "destructive" | "outline"> = {
  PENDING: "outline",
  CONFIRMED: "default",
  PROCESSING: "default",
  SHIPPED: "emerald",
  DELIVERED: "emerald",
  CANCELLED: "destructive",
  REFUNDED: "secondary",
};

export default function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("");

  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-orders", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "50" });
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/admin/orders?${params}`);
      const json: ApiResponse<AdminOrder[]> = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data ?? [];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json: ApiResponse = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Order status updated");
    },
    onError: () => toast.error("Failed to update order"),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl text-ivory-100">Orders</h1>
        <p className="mt-1 font-body text-obsidian-400">Manage customer orders</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={statusFilter === "" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("")}
        >
          All
        </Button>
        {STATUSES.map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(status)}
          >
            {status}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Orders ({orders?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <div className="h-64 animate-pulse rounded bg-obsidian-800" />
          ) : (
            <table className="w-full min-w-[900px] font-body text-sm">
              <thead>
                <tr className="border-b border-obsidian-800 text-left text-obsidian-400">
                  <th className="pb-3 pr-4 font-medium">Order</th>
                  <th className="pb-3 pr-4 font-medium">Customer</th>
                  <th className="pb-3 pr-4 font-medium">Date</th>
                  <th className="pb-3 pr-4 font-medium">Total</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 pr-4 font-medium">Payment</th>
                  <th className="pb-3 font-medium">Update Status</th>
                </tr>
              </thead>
              <tbody>
                {orders?.map((order) => (
                  <tr key={order.id} className="border-b border-obsidian-800/50">
                    <td className="py-4 pr-4">
                      <p className="font-medium text-ivory-100">{order.orderNumber}</p>
                      <p className="text-xs text-obsidian-500">
                        {order.items.map((i) => i.name).join(", ")}
                      </p>
                    </td>
                    <td className="py-4 pr-4">
                      <p className="text-ivory-100">{order.user.name ?? "—"}</p>
                      <p className="text-xs text-obsidian-500">{order.user.email}</p>
                    </td>
                    <td className="py-4 pr-4 text-obsidian-400">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="py-4 pr-4 text-gold-400">{formatPrice(order.total)}</td>
                    <td className="py-4 pr-4">
                      <Badge variant={statusVariant[order.status] ?? "secondary"}>
                        {order.status}
                      </Badge>
                    </td>
                    <td className="py-4 pr-4">
                      {order.payment ? (
                        <Badge variant="outline">{order.payment.status}</Badge>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-4">
                      <select
                        className="rounded-md border border-obsidian-700 bg-obsidian-900 px-2 py-1 text-xs text-ivory-100"
                        value={order.status}
                        onChange={(e) =>
                          updateStatusMutation.mutate({ id: order.id, status: e.target.value })
                        }
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!isLoading && orders?.length === 0 && (
            <p className="py-8 text-center font-body text-obsidian-400">No orders found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
