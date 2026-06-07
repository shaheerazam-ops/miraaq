import { requireAdmin } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-utils";
import { categorySchema } from "@/lib/validators/auth";
import { slugify } from "@/lib/utils";

export async function GET() {
  try {
    await requireAdmin();
    const categories = await db.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        _count: { select: { products: true } },
        parent: { select: { name: true } },
      },
    });
    return apiSuccess(
      categories.map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      }))
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Forbidden";
    return apiError(message, message === "Unauthorized" ? 401 : 403);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.errors[0]?.message ?? "Invalid category", 400);
    }

    const category = await db.category.create({
      data: {
        ...parsed.data,
        slug: slugify(parsed.data.name),
      },
    });

    return apiSuccess(category, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Create failed";
    return apiError(message, 500);
  }
}
