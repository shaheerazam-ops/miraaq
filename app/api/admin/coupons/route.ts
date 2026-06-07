import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-utils";

const createCouponSchema = z.object({
  code: z.string().min(3).max(20),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  value: z.number().positive(),
  minPurchase: z.number().positive().optional(),
  maxUses: z.number().int().positive().optional(),
  active: z.boolean().optional(),
  expiresAt: z.string().datetime().optional(),
});

export async function GET() {
  try {
    await requireAdmin();

    const coupons = await db.coupon.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { orders: true } },
      },
    });

    const serialized = coupons.map((c) => ({
      ...c,
      value: Number(c.value),
      minPurchase: c.minPurchase ? Number(c.minPurchase) : null,
    }));

    return apiSuccess(serialized);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const parsed = createCouponSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.errors.map((e) => e.message).join(", "), 400);
    }

    const data = parsed.data;
    const code = data.code.toUpperCase();

    const existing = await db.coupon.findUnique({ where: { code } });
    if (existing) return apiError("Coupon code already exists", 409);

    if (data.type === "PERCENTAGE" && data.value > 100) {
      return apiError("Percentage discount cannot exceed 100%", 400);
    }

    const coupon = await db.coupon.create({
      data: {
        code,
        type: data.type,
        value: data.value,
        minPurchase: data.minPurchase,
        maxUses: data.maxUses,
        active: data.active ?? true,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      },
    });

    return apiSuccess(
      {
        ...coupon,
        value: Number(coupon.value),
        minPurchase: coupon.minPurchase ? Number(coupon.minPurchase) : null,
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
