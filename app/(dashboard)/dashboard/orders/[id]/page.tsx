"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MapPin, CreditCard, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatPrice } from "@/lib/utils";
import type { ApiResponse } from "@/types";

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  createdAt: string;
  shippingAddress: {
    firstName: string;
    lastName: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  items: {
    id: string;
    name: string;
    quantity: number;
    price: number;
    volume: string;
    image: string;
    product: { slug: string };
  }[];
  payment?: {
    status: string;
    method: string;
    amount: number;
  } | null;
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

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;

  const { data: order, isLoading, error } = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${orderId}`);
      const json: ApiResponse<OrderDetail> = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data!;
    },
    enabled: !!orderId,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-obsidian-800" />
        <div className="h-64 animate-pulse rounded-lg bg-obsidian-800" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="py-16 text-center">
        <Package className="mx-auto h-12 w-12 text-obsidian-600" />
        <p className="mt-4 font-body text-obsidian-400">Order not found</p>
        <Link href="/dashboard/orders">
          <Button variant="outline" className="mt-4 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </Button>
        </Link>
      </div>
    );
  }

  const address = order.shippingAddress;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/dashboard/orders"
            className="mb-2 inline-flex items-center gap-1 font-body text-sm text-obsidian-400 hover:text-gold-400"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </Link>
          <h1 className="font-heading text-3xl text-ivory-100">{order.orderNumber}</h1>
          <p className="mt-1 font-body text-obsidian-400">Placed on {formatDate(order.createdAt)}</p>
        </div>
        <Badge variant={statusVariant[order.status] ?? "secondary"} className="w-fit text-sm">
          {order.status}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 border-b border-obsidian-800 pb-4 last:border-0 last:pb-0"
                >
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border border-obsidian-700">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <Link
                        href={`/shop/${item.product.slug}`}
                        className="font-body font-medium text-ivory-100 hover:text-gold-400"
                      >
                        {item.name}
                      </Link>
                      <p className="font-body text-sm text-obsidian-400">{item.volume}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="font-body text-sm text-obsidian-400">Qty: {item.quantity}</p>
                      <p className="font-heading text-gold-400">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-body text-ivory-100">
                {address.firstName} {address.lastName}
              </p>
              <p className="font-body text-sm text-obsidian-400">{address.street}</p>
              <p className="font-body text-sm text-obsidian-400">
                {address.city}, {address.state} {address.postalCode}
              </p>
              <p className="font-body text-sm text-obsidian-400">{address.country}</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 font-body text-sm">
              <div className="flex justify-between text-obsidian-400">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-obsidian-400">
                <span>Shipping</span>
                <span>{formatPrice(order.shippingCost)}</span>
              </div>
              <div className="flex justify-between text-obsidian-400">
                <span>Tax</span>
                <span>{formatPrice(order.taxAmount)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount</span>
                  <span>-{formatPrice(order.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-obsidian-700 pt-3 font-heading text-lg text-gold-400">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </CardContent>
          </Card>

          {order.payment && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 font-body text-sm">
                <div className="flex justify-between">
                  <span className="text-obsidian-400">Method</span>
                  <span className="text-ivory-100">{order.payment.method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-obsidian-400">Status</span>
                  <Badge variant="outline">{order.payment.status}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-obsidian-400">Amount</span>
                  <span className="text-gold-400">{formatPrice(order.payment.amount)}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
