import { requireAdmin } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-utils";
import { z } from "zod";

const updateSchema = z.object({
  approved: z.boolean(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return apiError("Invalid data", 400);

    const review = await db.review.update({
      where: { id },
      data: { approved: parsed.data.approved },
      include: {
        user: { select: { name: true } },
        product: { select: { name: true } },
      },
    });

    return apiSuccess({
      ...review,
      createdAt: review.createdAt.toISOString(),
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
    await db.review.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed";
    return apiError(message, 500);
  }
}
