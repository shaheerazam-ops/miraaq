import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/auth";
import { reviewSchema } from "@/lib/validators/auth";
import { apiSuccess, apiError, handleApiError, parseSearchParams } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  try {
    const { get, getNum } = parseSearchParams(req.nextUrl.searchParams);
    const productId = get("productId");
    const page = getNum("page") ?? 1;
    const limit = getNum("limit") ?? 10;
    const skip = (page - 1) * limit;

    if (!productId) {
      return apiError("productId query parameter is required", 400);
    }

    const where = { productId, approved: true };

    const [reviews, total] = await Promise.all([
      db.review.findMany({
        where,
        include: {
          user: { select: { name: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.review.count({ where }),
    ]);

    const ratings = await db.review.findMany({
      where,
      select: { rating: true },
    });
    const averageRating =
      ratings.length > 0
        ? Math.round((ratings.reduce((s, r) => s + r.rating, 0) / ratings.length) * 10) / 10
        : 0;

    return apiSuccess(
      { reviews, averageRating, totalRatings: total },
      200,
      { page, limit, total, totalPages: Math.ceil(total / limit) }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const parsed = reviewSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.errors.map((e) => e.message).join(", "), 400);
    }

    const { productId, rating, title, comment } = parsed.data;

    const product = await db.product.findUnique({ where: { id: productId, active: true } });
    if (!product) return apiError("Product not found", 404);

    const existingReview = await db.review.findUnique({
      where: { userId_productId: { userId: user.id, productId } },
    });
    if (existingReview) return apiError("You have already reviewed this product", 409);

    const hasPurchased = await db.orderItem.findFirst({
      where: {
        productId,
        order: { userId: user.id, status: { in: ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"] } },
      },
    });

    if (!hasPurchased) {
      return apiError("You must purchase this product before leaving a review", 403);
    }

    const review = await db.review.create({
      data: {
        userId: user.id,
        productId,
        rating,
        title,
        comment,
        approved: false,
      },
      include: {
        user: { select: { name: true, image: true } },
      },
    });

    return apiSuccess(review, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
