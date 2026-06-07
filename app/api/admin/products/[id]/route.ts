import { requireAdmin } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-utils";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    const product = await db.product.update({
      where: { id },
      data: {
        active: body.active,
        featured: body.featured,
        bestSeller: body.bestSeller,
        newArrival: body.newArrival,
        price: body.price,
        name: body.name,
      },
      include: { inventory: true, category: { select: { name: true } } },
    });

    if (body.quantity !== undefined) {
      await db.inventory.upsert({
        where: { productId: id },
        create: { productId: id, quantity: body.quantity },
        update: { quantity: body.quantity },
      });
    }

    return apiSuccess({
      ...product,
      price: Number(product.price),
      comparePrice: product.comparePrice ? Number(product.comparePrice) : null,
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
    await db.product.update({ where: { id }, data: { active: false } });
    return apiSuccess({ deleted: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed";
    return apiError(message, 500);
  }
}
