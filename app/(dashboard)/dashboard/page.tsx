"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Package, Heart, MapPin, ShoppingBag, ArrowRight } from "lucide-react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatPrice } from "@/lib/utils";
import type { ApiResponse } from "@/types";

interface OrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  items: { name: string; quantity: number }[];
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

export default function DashboardPage() {
  const { data: session } = useSession();

  const { data: orders, isLoading } = useQuery({
    queryKey: ["recent-orders"],
    queryFn: async () => {
      const res = await fetch("/api/orders/recent");
      const json: ApiResponse<OrderSummary[]> = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data ?? [];
    },
  });

  const stats = [
    {
      label: "Recent Orders",
      value: orders?.length ?? 0,
      icon: Package,
      href: "/dashboard/orders",
    },
    {
      label: "Wishlist",
      value: "View",
      icon: Heart,
      href: "/dashboard/wishlist",
    },
    {
      label: "Addresses",
      value: "Manage",
      icon: MapPin,
      href: "/dashboard/addresses",
    },
    {
      label: "Shop",
      value: "Browse",
      icon: ShoppingBag,
      href: "/shop",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl text-ivory-100">
          Welcome{session?.user?.name ? `, ${session.user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-1 font-body text-obsidian-400">
          Manage your orders, wishlist, and account settings
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href}>
            <Card className="transition-all hover:border-gold-500/30 hover:shadow-gold-sm">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold-500/10">
                  <Icon className="h-5 w-5 text-gold-400" />
                </div>
                <div>
                  <p className="font-body text-sm text-obsidian-400">{label}</p>
                  <p className="font-heading text-xl text-ivory-100">{value}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Orders</CardTitle>
          <Link href="/dashboard/orders">
            <Button variant="ghost" size="sm" className="gap-1">
              View All
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-md bg-obsidian-800" />
              ))}
            </div>
          ) : orders && orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/dashboard/orders/${order.id}`}
                  className="flex flex-col gap-3 rounded-md border border-obsidian-800 p-4 transition-colors hover:border-gold-500/20 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="font-body font-medium text-ivory-100">{order.orderNumber}</p>
                      <Badge variant={statusVariant[order.status] ?? "secondary"}>
                        {order.status}
                      </Badge>
                    </div>
                    <p className="mt-1 font-body text-sm text-obsidian-400">
                      {formatDate(order.createdAt)} · {order.items.length} item
                      {order.items.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <p className="font-heading text-lg text-gold-400">{formatPrice(order.total)}</p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <Package className="mx-auto h-12 w-12 text-obsidian-600" />
              <p className="mt-4 font-body text-obsidian-400">No orders yet</p>
              <Link href="/shop">
                <Button variant="luxury" className="mt-4">
                  Start Shopping
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
