import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/auth";
import { apiSuccess, apiError, handleApiError, parseSearchParams } from "@/lib/api-utils";

const updateReviewSchema = z.object({
  id: z.string().min(1),
  approved: z.boolean(),
});

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { get, getNum, getBool } = parseSearchParams(req.nextUrl.searchParams);
    const page = getNum("page") ?? 1;
    const limit = getNum("limit") ?? 20;
    const approved = get("approved");
    const productId = get("productId");
    const skip = (page - 1) * limit;

    const where: { approved?: boolean; productId?: string } = {};

    if (approved === "true") where.approved = true;
    else if (approved === "false") where.approved = false;
    else if (getBool("pending")) where.approved = false;

    if (productId) where.productId = productId;

    const [reviews, total] = await Promise.all([
      db.review.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
          product: { select: { id: true, name: true, slug: true, thumbnail: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.review.count({ where }),
    ]);

    return apiSuccess(reviews, 200, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const parsed = updateReviewSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.errors.map((e) => e.message).join(", "), 400);
    }

    const { id, approved } = parsed.data;

    const existing = await db.review.findUnique({
      where: { id },
      include: { user: { select: { id: true } }, product: { select: { name: true, slug: true } } },
    });

    if (!existing) return apiError("Review not found", 404);

    const review = await db.$transaction(async (tx) => {
      const updated = await tx.review.update({
        where: { id },
        data: { approved },
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
          product: { select: { id: true, name: true, slug: true, thumbnail: true } },
        },
      });

      if (approved && !existing.approved) {
        await tx.notification.create({
          data: {
            userId: existing.userId,
            type: "REVIEW",
            title: "Review Approved",
            message: `Your review for ${existing.product.name} has been published.`,
            link: `/products/${existing.product.slug}`,
          },
        });
      }

      return updated;
    });

    return apiSuccess(review);
  } catch (error) {
    return handleApiError(error);
  }
}
