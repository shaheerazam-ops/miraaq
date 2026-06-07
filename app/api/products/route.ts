import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/auth";
import { productSchema } from "@/lib/validators/auth";
import { getProducts } from "@/services/product.service";
import { slugify } from "@/lib/utils";
import { apiSuccess, apiError, handleApiError, parseSearchParams } from "@/lib/api-utils";
import type { ShopFilters } from "@/types";

const createProductSchema = productSchema.extend({
  images: z.array(z.string().url()).min(1, "At least one image is required"),
  thumbnail: z.string().url(),
  videoUrl: z.string().url().optional(),
  model3dUrl: z.string().url().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { get, getNum, getBool } = parseSearchParams(req.nextUrl.searchParams);

    const filters: ShopFilters = {
      search: get("search"),
      category: get("category"),
      gender: get("gender"),
      fragranceFamily: get("fragranceFamily"),
      volume: get("volume"),
      minPrice: getNum("minPrice"),
      maxPrice: getNum("maxPrice"),
      sort: get("sort"),
      page: getNum("page") ?? 1,
      limit: getNum("limit") ?? 12,
      featured: getBool("featured") || undefined,
      bestSeller: getBool("bestSeller") || undefined,
      newArrival: getBool("newArrival") || undefined,
      comboOffer: getBool("comboOffer") || undefined,
    };

    const result = await getProducts(filters);
    return apiSuccess(result.products, 200, result.meta);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const parsed = createProductSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.errors.map((e) => e.message).join(", "), 400);
    }

    const data = parsed.data;
    const slug = slugify(data.name);

    const existingSlug = await db.product.findUnique({ where: { slug } });
    const existingSku = await db.product.findUnique({ where: { sku: data.sku } });
    if (existingSlug) return apiError("A product with this name already exists", 409);
    if (existingSku) return apiError("SKU already in use", 409);

    const category = await db.category.findUnique({ where: { id: data.categoryId } });
    if (!category) return apiError("Category not found", 404);

    const product = await db.product.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        shortDesc: data.shortDesc,
        price: data.price,
        comparePrice: data.comparePrice,
        sku: data.sku,
        volume: data.volume,
        gender: data.gender,
        fragranceFamily: data.fragranceFamily,
        topNotes: data.topNotes,
        heartNotes: data.heartNotes,
        baseNotes: data.baseNotes,
        images: data.images,
        thumbnail: data.thumbnail,
        videoUrl: data.videoUrl,
        model3dUrl: data.model3dUrl,
        featured: data.featured ?? false,
        bestSeller: data.bestSeller ?? false,
        newArrival: data.newArrival ?? false,
        comboOffer: data.comboOffer ?? false,
        active: data.active ?? true,
        categoryId: data.categoryId,
        inventory: {
          create: { quantity: data.quantity },
        },
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        inventory: { select: { quantity: true } },
      },
    });

    return apiSuccess(
      {
        ...product,
        price: Number(product.price),
        comparePrice: product.comparePrice ? Number(product.comparePrice) : null,
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
