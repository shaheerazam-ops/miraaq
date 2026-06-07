"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Package, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatPrice } from "@/lib/utils";
import type { ApiResponse } from "@/types";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  items: { name: string; quantity: number; image: string }[];
  payment?: { status: string } | null;
}

const statusVariant: Record<string, "default" | "secondary" | "emerald" | "destructive" | "outline"> = {
  PENDING: "outline",
  CONFIRMED: "default",
  PROCESSING: "default",
  SHIPPED: "emerald",
  DELIVERED: "emerald",
  CANCELLED: "destructive",
  REFUNDED: "secondary",
};

export default function OrdersPage() {
  const { data: orders, isLoading, error } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const res = await fetch("/api/orders?limit=50");
      const json: ApiResponse<Order[]> = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data ?? [];
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl text-ivory-100">Order History</h1>
        <p className="mt-1 font-body text-obsidian-400">View and track all your orders</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-md bg-obsidian-800" />
              ))}
            </div>
          ) : error ? (
            <p className="font-body text-red-400">Failed to load orders</p>
          ) : orders && orders.length > 0 ? (
            <div className="divide-y divide-obsidian-800">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/dashboard/orders/${order.id}`}
                  className="flex flex-col gap-4 py-6 transition-colors first:pt-0 last:pb-0 hover:opacity-90 sm:flex-row sm:items-center"
                >
                  <div className="flex flex-1 items-start gap-4">
                    {order.items[0]?.image && (
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-obsidian-700">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={order.items[0].image}
                          alt={order.items[0].name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-body font-medium text-ivory-100">{order.orderNumber}</p>
                        <Badge variant={statusVariant[order.status] ?? "secondary"}>
                          {order.status}
                        </Badge>
                        {order.payment && (
                          <Badge variant="outline">{order.payment.status}</Badge>
                        )}
                      </div>
                      <p className="mt-1 font-body text-sm text-obsidian-400">
                        {formatDate(order.createdAt)}
                      </p>
                      <p className="mt-1 truncate font-body text-sm text-obsidian-500">
                        {order.items.map((i) => `${i.name} × ${i.quantity}`).join(", ")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 sm:shrink-0">
                    <p className="font-heading text-lg text-gold-400">{formatPrice(order.total)}</p>
                    <ChevronRight className="h-5 w-5 text-obsidian-500" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <Package className="mx-auto h-12 w-12 text-obsidian-600" />
              <p className="mt-4 font-body text-obsidian-400">You haven&apos;t placed any orders yet</p>
              <Link href="/shop">
                <Button variant="luxury" className="mt-4">
                  Explore Collection
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
