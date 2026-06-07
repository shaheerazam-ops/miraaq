import { requireAdmin } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-utils";
import { z } from "zod";

const updateSchema = z.object({
  quantity: z.number().int().min(0),
  lowStockThreshold: z.number().int().min(0).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return apiError("Invalid inventory data", 400);

    const inventory = await db.inventory.update({
      where: { id },
      data: parsed.data,
      include: {
        product: { select: { name: true, sku: true } },
      },
    });

    return apiSuccess({
      ...inventory,
      updatedAt: inventory.updatedAt.toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed";
    return apiError(message, 500);
  }
}
