import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/auth";
import { categorySchema } from "@/lib/validators/auth";
import { getCategories } from "@/services/product.service";
import { slugify } from "@/lib/utils";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-utils";

export async function GET() {
  try {
    const categories = await getCategories();
    return apiSuccess(categories);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const parsed = categorySchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.errors.map((e) => e.message).join(", "), 400);
    }

    const data = parsed.data;
    const slug = slugify(data.name);

    const existing = await db.category.findUnique({ where: { slug } });
    if (existing) return apiError("A category with this name already exists", 409);

    if (data.parentId) {
      const parent = await db.category.findUnique({ where: { id: data.parentId } });
      if (!parent) return apiError("Parent category not found", 404);
    }

    const category = await db.category.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        parentId: data.parentId,
        featured: data.featured ?? false,
        sortOrder: data.sortOrder ?? 0,
      },
      include: { _count: { select: { products: true } } },
    });

    return apiSuccess(category, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
