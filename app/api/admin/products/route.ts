import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/auth";
import { apiSuccess, handleApiError, parseSearchParams } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { get, getNum, getBool } = parseSearchParams(req.nextUrl.searchParams);
    const page = getNum("page") ?? 1;
    const limit = getNum("limit") ?? 20;
    const search = get("search");
    const categoryId = get("categoryId");
    const activeOnly = getBool("activeOnly");
    const skip = (page - 1) * limit;

    const where: {
      active?: boolean;
      categoryId?: string;
      OR?: Array<{ name?: { contains: string; mode: "insensitive" }; sku?: { contains: string; mode: "insensitive" } }>;
    } = {};

    if (activeOnly) where.active = true;
    if (categoryId) where.categoryId = categoryId;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ];
    }

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          inventory: { select: { quantity: true, lowStockThreshold: true } },
          _count: { select: { reviews: true, orderItems: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.product.count({ where }),
    ]);

    const serialized = products.map((p) => ({
      ...p,
      price: Number(p.price),
      comparePrice: p.comparePrice ? Number(p.comparePrice) : null,
    }));

    return apiSuccess(serialized, 200, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
