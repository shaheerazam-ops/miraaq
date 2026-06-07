import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-utils";

type RouteContext = { params: Promise<{ id: string }> };

function serializeOrder(order: {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: { toString(): string } | number;
  shippingCost: { toString(): string } | number;
  taxAmount: { toString(): string } | number;
  discountAmount: { toString(): string } | number;
  total: { toString(): string } | number;
  shippingAddress: unknown;
  billingAddress: unknown;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: Array<{
    id: string;
    quantity: number;
    price: { toString(): string } | number;
    name: string;
    volume: string;
    image: string;
    product: { slug: string; id: string };
  }>;
  payment?: { status: string; method: string; stripeSessionId?: string | null; stripePaymentId?: string | null } | null;
  coupon?: { code: string; type?: string; value?: { toString(): string } | number } | null;
}) {
  return {
    ...order,
    subtotal: Number(order.subtotal),
    shippingCost: Number(order.shippingCost),
    taxAmount: Number(order.taxAmount),
    discountAmount: Number(order.discountAmount),
    total: Number(order.total),
    items: order.items.map((item) => ({
      ...item,
      price: Number(item.price),
    })),
    coupon: order.coupon
      ? {
          ...order.coupon,
          value: order.coupon.value ? Number(order.coupon.value) : undefined,
        }
      : null,
  };
}

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth();
    const { id } = await context.params;

    const order = await db.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: { select: { slug: true, id: true } } } },
        payment: true,
        coupon: { select: { code: true, type: true, value: true } },
      },
    });

    if (!order) return apiError("Order not found", 404);
    if (order.userId !== user.id && user.role !== "ADMIN") {
      return apiError("Forbidden", 403);
    }

    return apiSuccess(serializeOrder(order));
  } catch (error) {
    return handleApiError(error);
  }
}
