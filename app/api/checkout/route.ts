import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/auth";
import { appConfig } from "@/lib/env";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-utils";
import { PaymentGatewayRegistry } from "@/lib/payments/abstractions/gateway.registry";
import type { PaymentGatewayId } from "@/lib/payments/abstractions/gateway.interface";

// ─── Validation ────────────────────────────────────────────────────────────────

const SUPPORTED_GATEWAYS = [
  "payfast",
  "safepay",
  "hblpay",
  "easypaisa",
  "jazzcash",
  "cod",
] as const;

const checkoutSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  gateway: z.enum(SUPPORTED_GATEWAYS, {
    errorMap: () => ({
      message: `Gateway must be one of: ${SUPPORTED_GATEWAYS.join(", ")}`,
    }),
  }),
});

// ─── Route Handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await req.json();
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        parsed.error.errors.map((e) => e.message).join(", "),
        400
      );
    }

    const { orderId, gateway } = parsed.data;

    // ── 1. Load order ──────────────────────────────────────────────────────────
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        payment: true,
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });

    if (!order) return apiError("Order not found", 404);
    if (order.userId !== user.id) return apiError("Forbidden", 403);

    if (order.status !== "PENDING") {
      return apiError(
        `Order cannot be checked out — current status: ${order.status.toLowerCase()}`,
        400
      );
    }

    if (order.payment?.status === "PAID") {
      return apiError("This order has already been paid", 400);
    }

    // ── 2. Cash on Delivery — no gateway call needed ───────────────────────────
    if (gateway === "cod") {
      await db.$transaction([
        db.payment.update({
          where: { orderId: order.id },
          data: {
            gateway: "COD",
            method: "CASH_ON_DELIVERY",
            status: "PENDING",
            currency: appConfig.currency.toLowerCase(),
          },
        }),
        db.order.update({
          where: { id: order.id },
          data: { status: "CONFIRMED" },
        }),
      ]);

      return apiSuccess({
        gateway: "cod",
        url: `${appConfig.url}/checkout/success?order=${order.orderNumber}`,
      });
    }

    // ── 3. Validate gateway is available ──────────────────────────────────────
    const gatewayId = gateway as PaymentGatewayId;

    if (!PaymentGatewayRegistry.isGatewayAvailable(gatewayId)) {
      return apiError(
        `Payment method "${gateway}" is not available right now. Please choose another.`,
        400
      );
    }

    const gatewayInstance = PaymentGatewayRegistry.getGateway(gatewayId);
    const orderTotal = Number(order.total);

    if (!gatewayInstance.supportsAmount(orderTotal)) {
      const config = gatewayInstance.getConfig();
      return apiError(
        `Order total ₨${orderTotal.toLocaleString()} is outside the allowed range ` +
          `(₨${config.minAmount.toLocaleString()} – ₨${config.maxAmount.toLocaleString()}) ` +
          `for ${config.displayName}. Please choose a different payment method.`,
        400
      );
    }

    // ── 4. Build payer info ───────────────────────────────────────────────────
    const payer = {
      name: order.user?.name ?? user.name ?? "Customer",
      email: order.user?.email ?? user.email,
      phone: order.user?.phone ?? undefined,
    };

    // ── 5. Build callback URLs ────────────────────────────────────────────────
    const baseUrl = appConfig.url;
    const successUrl =
      `${baseUrl}/checkout/success` +
      `?order=${order.orderNumber}` +
      `&gateway=${gateway}`;
    const failureUrl =
      `${baseUrl}/checkout/failure` +
      `?order=${order.orderNumber}` +
      `&gateway=${gateway}`;
    const cancelUrl =
      `${baseUrl}/checkout` +
      `?order=${order.id}` +
      `&cancelled=true`;
    const webhookUrl = `${baseUrl}/api/webhooks/${gateway}`;

    // ── 6. Call gateway ───────────────────────────────────────────────────────
    const gatewayResponse = await gatewayInstance.initializePayment({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: orderTotal,
      currency: "PKR",
      payer,
      description: `Aurum Oud — Order #${order.orderNumber}`,
      successUrl,
      failureUrl,
      cancelUrl,
      webhookUrl,
      metadata: {
        order_id: order.id,
        user_id: user.id,
      },
    });

    if (!gatewayResponse.success) {
      console.error(`[Checkout] Gateway error (${gateway}):`, gatewayResponse.error);
      return apiError(
        gatewayResponse.error ?? "Payment initialisation failed. Please try again.",
        502
      );
    }

    // ── 7. Persist gateway reference on payment row ───────────────────────────
    await db.payment.update({
      where: { orderId: order.id },
      data: {
        gateway: gateway.toUpperCase() as never,
        method: resolvePaymentMethod(gateway),
        status: "PROCESSING",
        currency: appConfig.currency.toLowerCase(),
        // gatewayRef replaces stripePaymentId — the provider's transaction token
        gatewayRef: gatewayResponse.gatewayTransactionId ?? null,
        // sessionRef replaces stripeSessionId — the provider's session/order ID
        sessionRef: gatewayResponse.gatewayOrderId ?? order.orderNumber,
      },
    });

    // ── 8. Mark order as payment-pending ──────────────────────────────────────
    await db.order.update({
      where: { id: order.id },
      data: { status: "PENDING" },
    });

    // ── 9. Return redirect info to client ─────────────────────────────────────
    //
    // For hosted-redirect gateways (PayFast, SafePay, HBLPay):
    //   { url } — client does window.location.href = url
    //
    // For wallet gateways (EasyPaisa, JazzCash) that use a POST-form redirect:
    //   { formAction, formFields } — client renders a hidden form and submits it
    //   { deepLink } — optional; client can offer "Open in app" button
    //
    if (gatewayResponse.redirectUrl) {
      return apiSuccess({
        gateway,
        url: gatewayResponse.redirectUrl,
        formAction: gatewayResponse.formAction ?? null,
        formFields: gatewayResponse.formFields ?? null,
        deepLink: gatewayResponse.deepLink ?? null,
        qrCode: gatewayResponse.qrCode ?? null,
      });
    }

    // Fallback: if gateway returns only form fields (POST redirect), tell the
    // client to self-submit. The client must render this form and submit it.
    if (gatewayResponse.formAction && gatewayResponse.formFields) {
      return apiSuccess({
        gateway,
        url: null,
        formAction: gatewayResponse.formAction,
        formFields: gatewayResponse.formFields,
        deepLink: gatewayResponse.deepLink ?? null,
        qrCode: null,
      });
    }

    // Should not reach here if the gateway is implemented correctly
    console.error(`[Checkout] Gateway (${gateway}) returned no url or formAction`);
    return apiError("Payment gateway returned an unexpected response.", 502);
  } catch (error) {
    return handleApiError(error);
  }
}

// ─── GET — list available gateways for the checkout UI ────────────────────────
//
// Called by the checkout page to populate the gateway selector.
// Returns only the fields the UI needs (no secrets).
//
export async function GET(_req: NextRequest) {
  try {
    const gateways = PaymentGatewayRegistry.getActiveGateways().map((g) => ({
      id: g.gatewayId,
      name: g.displayName,
      description: g.description ?? null,
      logo: g.logo ?? null,
      minAmount: g.minAmount,
      maxAmount: g.maxAmount,
      methods: g.supportedMethods,
    }));

    // Always include COD as the last option
    const allOptions = [
      ...gateways,
      {
        id: "cod",
        name: "Cash on Delivery",
        description: "Pay in cash when your order arrives",
        logo: "/icons/cod.svg",
        minAmount: 0,
        maxAmount: 50_000,
        methods: ["cash_on_delivery"],
      },
    ];

    return apiSuccess(allOptions);
  } catch (error) {
    return handleApiError(error);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolvePaymentMethod(gateway: (typeof SUPPORTED_GATEWAYS)[number]) {
  const map: Record<(typeof SUPPORTED_GATEWAYS)[number], string> = {
    payfast:   "CREDIT_CARD",
    safepay:   "CREDIT_CARD",
    hblpay:    "CREDIT_CARD",
    easypaisa: "EASYPAISA_WALLET",
    jazzcash:  "JAZZCASH_WALLET",
    cod:       "CASH_ON_DELIVERY",
  };
  return map[gateway] as never;
}