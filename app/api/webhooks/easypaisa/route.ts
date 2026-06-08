import { NextRequest } from "next/server";
import { paymentService } from "@/services/payment.service";
import { apiSuccess, apiError } from "@/lib/api-utils";

// Easypaisa sends POST as application/x-www-form-urlencoded
// Payload includes a hash field for verification
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const headers = Object.fromEntries(req.headers.entries());

    // Easypaisa sends form-encoded data
    const payload = Object.fromEntries(new URLSearchParams(rawBody));

    const result = await paymentService.processWebhook(
      "easypaisa",
      payload,
      headers,
      rawBody
    );

    if (!result.success) {
      console.error("[Webhook/Easypaisa] Processing failed:", result.message);
      return apiError(result.message, 400);
    }

    // Easypaisa expects a specific response format
    return apiSuccess({ received: true });
  } catch (error) {
    console.error("[Webhook/Easypaisa] Unhandled error:", error);
    return apiError("Webhook handler failed", 500);
  }
}