import { requireAdmin } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-utils";
import { categorySchema } from "@/lib/validators/auth";
import { slugify } from "@/lib/utils";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.errors[0]?.message ?? "Invalid category", 400);
    }

    const category = await db.category.update({
      where: { id },
      data: {
        ...parsed.data,
        slug: slugify(parsed.data.name),
      },
    });

    return apiSuccess(category);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed";
    return apiError(message, 500);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const count = await db.product.count({ where: { categoryId: id } });
    if (count > 0) {
      return apiError("Cannot delete category with products", 400);
    }
    await db.category.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed";
    return apiError(message, 500);
  }
}
