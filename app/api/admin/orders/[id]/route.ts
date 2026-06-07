import { NextRequest } from "next/server";
import { z } from "zod";
import { OrderStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-utils";

const updateOrderSchema = z.object({
  status: z.enum([
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "REFUNDED",
  ]),
  notes: z.string().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const body = await req.json();
    const parsed = updateOrderSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.errors.map((e) => e.message).join(", "), 400);
    }

    const existing = await db.order.findUnique({
      where: { id },
      include: { user: { select: { id: true } } },
    });

    if (!existing) return apiError("Order not found", 404);

    const { status, notes } = parsed.data;

    const order = await db.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: {
          status: status as OrderStatus,
          ...(notes !== undefined ? { notes } : {}),
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: true,
          payment: { select: { status: true, method: true } },
          coupon: { select: { code: true } },
        },
      });

      if (status !== existing.status) {
        const statusMessages: Record<string, string> = {
          CONFIRMED: "Your order has been confirmed.",
          PROCESSING: "Your order is being processed.",
          SHIPPED: "Your order has been shipped!",
          DELIVERED: "Your order has been delivered.",
          CANCELLED: "Your order has been cancelled.",
          REFUNDED: "Your order has been refunded.",
        };

        if (statusMessages[status]) {
          await tx.notification.create({
            data: {
              userId: existing.userId,
              type: "ORDER",
              title: `Order ${existing.orderNumber} Updated`,
              message: statusMessages[status],
              link: `/dashboard/orders/${existing.id}`,
            },
          });
        }
      }

      return updated;
    });

    return apiSuccess({
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
    });
  } catch (error) {
    return handleApiError(error);
  }
}
