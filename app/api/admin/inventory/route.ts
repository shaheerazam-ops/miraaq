import { requireAdmin } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-utils";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const lowStock = searchParams.get("lowStock") === "true";

    const items = await db.inventory.findMany({
      orderBy: { quantity: "asc" },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            slug: true,
            thumbnail: true,
            active: true,
          },
        },
      },
    });

    const inventory = lowStock
      ? items.filter((item) => item.quantity <= item.lowStockThreshold)
      : items;

    return apiSuccess(
      inventory.map((i) => ({
        ...i,
        updatedAt: i.updatedAt.toISOString(),
      }))
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Forbidden";
    return apiError(message, message === "Unauthorized" ? 401 : 403);
  }
}
