import { requireAdmin } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-utils";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    const coupon = await db.coupon.update({
      where: { id },
      data: {
        active: body.active,
        maxUses: body.maxUses,
        value: body.value,
      },
    });

    return apiSuccess({
      ...coupon,
      value: Number(coupon.value),
      minPurchase: coupon.minPurchase ? Number(coupon.minPurchase) : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed";
    return apiError(message, 500);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    await db.coupon.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed";
    return apiError(message, 500);
  }
}
