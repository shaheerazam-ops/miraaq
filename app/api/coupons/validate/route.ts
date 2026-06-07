import { NextRequest } from "next/server";
import { z } from "zod";
import { validateCoupon } from "@/services/product.service";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-utils";

const validateCouponSchema = z.object({
  code: z.string().min(1, "Coupon code is required"),
  subtotal: z.number().min(0, "Subtotal must be non-negative"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = validateCouponSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.errors.map((e) => e.message).join(", "), 400);
    }

    const { code, subtotal } = parsed.data;
    const result = await validateCoupon(code, subtotal);

    if (!result.valid) {
      return apiError(result.message, 400);
    }

    return apiSuccess({
      valid: true,
      discount: result.discount,
      couponId: result.couponId,
      message: result.message,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
