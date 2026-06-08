import { NextRequest } from "next/server";
import { paymentService } from "@/services/payment.service";
import { apiSuccess, apiError } from "@/lib/api-utils";

// JazzCash sends POST as application/x-www-form-urlencoded
// Payload includes pp_SecureHash for verification
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const headers = Object.fromEntries(req.headers.entries());

    // JazzCash sends form-encoded data with pp_ prefixed fields
    const payload = Object.fromEntries(new URLSearchParams(rawBody));

    const result = await paymentService.processWebhook(
      "jazzcash",
      payload,
      headers,
      rawBody
    );

    if (!result.success) {
      console.error("[Webhook/JazzCash] Processing failed:", result.message);
      return apiError(result.message, 400);
    }

    return apiSuccess({ received: true });
  } catch (error) {
    console.error("[Webhook/JazzCash] Unhandled error:", error);
    return apiError("Webhook handler failed", 500);
  }
}