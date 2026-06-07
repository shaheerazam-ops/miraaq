import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/auth";
import { createCheckoutSession } from "@/lib/stripe";
import { appConfig } from "@/lib/env";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-utils";

const checkoutSchema = z.object({
  orderId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.errors.map((e) => e.message).join(", "), 400);
    }

    const { orderId } = parsed.data;

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        payment: true,
      },
    });

    if (!order) return apiError("Order not found", 404);
    if (order.userId !== user.id) return apiError("Forbidden", 403);
    if (order.status !== "PENDING") {
      return apiError("Order is not eligible for checkout", 400);
    }
    if (order.payment?.status === "PAID") {
      return apiError("Order has already been paid", 400);
    }

    let lineItems = order.items.map((item) => ({
      name: item.name,
      price: Number(item.price),
      quantity: item.quantity,
      image: item.image.startsWith("http") ? item.image : undefined,
    }));

    const itemsSubtotal = lineItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discountAmount = Number(order.discountAmount);

    if (discountAmount > 0 && itemsSubtotal > 0) {
      const discountRatio = discountAmount / itemsSubtotal;
      lineItems = lineItems.map((item) => ({
        ...item,
        price: Math.round(item.price * (1 - discountRatio) * 100) / 100,
      }));
    }

    if (Number(order.shippingCost) > 0) {
      lineItems.push({
        name: "Shipping",
        price: Number(order.shippingCost),
        quantity: 1,
        image: undefined,
      });
    }

    if (Number(order.taxAmount) > 0) {
      lineItems.push({
        name: "Tax",
        price: Number(order.taxAmount),
        quantity: 1,
        image: undefined,
      });
    }

    const session = await createCheckoutSession({
      orderId: order.id,
      orderNumber: order.orderNumber,
      items: lineItems,
      customerEmail: user.email,
      successUrl: `${appConfig.url}/checkout/success?order=${order.orderNumber}&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${appConfig.url}/checkout?order=${order.id}&cancelled=true`,
    });

    await db.payment.update({
      where: { orderId: order.id },
      data: { stripeSessionId: session.id },
    });

    return apiSuccess({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
