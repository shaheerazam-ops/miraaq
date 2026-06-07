import { NextRequest } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { constructWebhookEvent } from "@/lib/stripe";
import { apiSuccess, apiError } from "@/lib/api-utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return apiError("Missing stripe-signature header", 400);
    }

    let event: Stripe.Event;
    try {
      event = await constructWebhookEvent(body, signature);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Webhook verification failed";
      return apiError(message, 400);
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;

        if (!orderId) break;

        const order = await db.order.findUnique({
          where: { id: orderId },
          include: { items: true, payment: true },
        });

        if (!order || order.payment?.status === "PAID") break;

        await db.$transaction(async (tx) => {
          await tx.payment.update({
            where: { orderId },
            data: {
              status: "PAID",
              stripePaymentId: session.payment_intent as string,
              stripeSessionId: session.id,
            },
          });

          await tx.order.update({
            where: { id: orderId },
            data: { status: "CONFIRMED" },
          });

          for (const item of order.items) {
            await tx.inventory.updateMany({
              where: { productId: item.productId, quantity: { gte: item.quantity } },
              data: { quantity: { decrement: item.quantity } },
            });
          }

          if (order.couponId) {
            await tx.coupon.update({
              where: { id: order.couponId },
              data: { usedCount: { increment: 1 } },
            });
          }

          await tx.cartItem.deleteMany({ where: { userId: order.userId } });

          await tx.notification.create({
            data: {
              userId: order.userId,
              type: "ORDER",
              title: "Order Confirmed",
              message: `Your order ${order.orderNumber} has been confirmed. Thank you for shopping with Miraaq!`,
              link: `/dashboard/orders/${order.id}`,
            },
          });
        });
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;
        if (!orderId) break;

        await db.order.updateMany({
          where: { id: orderId, status: "PENDING" },
          data: { status: "CANCELLED" },
        });
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = charge.payment_intent as string;

        const payment = await db.payment.findFirst({
          where: { stripePaymentId: paymentIntentId },
        });

        if (payment) {
          await db.$transaction([
            db.payment.update({
              where: { id: payment.id },
              data: { status: "REFUNDED" },
            }),
            db.order.update({
              where: { id: payment.orderId },
              data: { status: "REFUNDED" },
            }),
          ]);
        }
        break;
      }

      default:
        break;
    }

    return apiSuccess({ received: true });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return apiError("Webhook handler failed", 500);
  }
}
