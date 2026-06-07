import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/auth";
import { productSchema } from "@/lib/validators/auth";
import { getProductBySlug, getRelatedProducts } from "@/services/product.service";
import { slugify } from "@/lib/utils";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-utils";

const updateProductSchema = productSchema
  .partial()
  .extend({
    images: z.array(z.string().url()).optional(),
    thumbnail: z.string().url().optional(),
    videoUrl: z.string().url().nullable().optional(),
    model3dUrl: z.string().url().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const product = await getProductBySlug(slug);

    if (!product) {
      return apiError("Product not found", 404);
    }

    const related = await getRelatedProducts(product.id, product.category.id);
    return apiSuccess({ product, related });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    await requireAdmin();
    const { slug } = await context.params;
    const body = await req.json();
    const parsed = updateProductSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.errors.map((e) => e.message).join(", "), 400);
    }

    const existing = await db.product.findUnique({
      where: { slug },
      include: { inventory: true },
    });
    if (!existing) return apiError("Product not found", 404);

    const data = parsed.data;
    const updateData: Record<string, unknown> = { ...data };
    delete updateData.quantity;

    if (data.name && data.name !== existing.name) {
      const newSlug = slugify(data.name);
      const slugConflict = await db.product.findFirst({
        where: { slug: newSlug, NOT: { id: existing.id } },
      });
      if (slugConflict) return apiError("A product with this name already exists", 409);
      updateData.slug = newSlug;
    }

    if (data.sku && data.sku !== existing.sku) {
      const skuConflict = await db.product.findFirst({
        where: { sku: data.sku, NOT: { id: existing.id } },
      });
      if (skuConflict) return apiError("SKU already in use", 409);
    }

    if (data.categoryId) {
      const category = await db.category.findUnique({ where: { id: data.categoryId } });
      if (!category) return apiError("Category not found", 404);
    }

    const product = await db.$transaction(async (tx) => {
      if (data.quantity !== undefined) {
        await tx.inventory.upsert({
          where: { productId: existing.id },
          create: { productId: existing.id, quantity: data.quantity },
          update: { quantity: data.quantity },
        });
      }

      return tx.product.update({
        where: { id: existing.id },
        data: updateData,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          inventory: { select: { quantity: true } },
        },
      });
    });

    return apiSuccess({
      ...product,
      price: Number(product.price),
      comparePrice: product.comparePrice ? Number(product.comparePrice) : null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    await requireAdmin();
    const { slug } = await context.params;

    const product = await db.product.findUnique({ where: { slug } });
    if (!product) return apiError("Product not found", 404);

    await db.product.update({
      where: { id: product.id },
      data: { active: false },
    });

    return apiSuccess({ message: "Product deactivated successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
