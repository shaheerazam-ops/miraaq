import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-utils";

const wishlistSchema = z.object({
  productId: z.string().min(1),
});

function serializeWishlistItem(item: {
  id: string;
  createdAt: Date;
  product: {
    id: string;
    name: string;
    slug: string;
    price: { toString(): string } | number;
    comparePrice: { toString(): string } | number | null;
    thumbnail: string;
    volume: string;
    featured: boolean;
    active: boolean;
  };
}) {
  return {
    id: item.id,
    createdAt: item.createdAt,
    product: {
      ...item.product,
      price: Number(item.product.price),
      comparePrice: item.product.comparePrice ? Number(item.product.comparePrice) : null,
    },
  };
}

export async function GET() {
  try {
    const user = await requireAuth();

    const items = await db.wishlistItem.findMany({
      where: { userId: user.id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            comparePrice: true,
            thumbnail: true,
            volume: true,
            featured: true,
            active: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess(items.map(serializeWishlistItem));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const parsed = wishlistSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.errors.map((e) => e.message).join(", "), 400);
    }

    const { productId } = parsed.data;

    const product = await db.product.findUnique({ where: { id: productId, active: true } });
    if (!product) return apiError("Product not found", 404);

    const existing = await db.wishlistItem.findUnique({
      where: { userId_productId: { userId: user.id, productId } },
    });
    if (existing) return apiError("Product is already in your wishlist", 409);

    const item = await db.wishlistItem.create({
      data: { userId: user.id, productId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            comparePrice: true,
            thumbnail: true,
            volume: true,
            featured: true,
            active: true,
          },
        },
      },
    });

    return apiSuccess(serializeWishlistItem(item), 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const parsed = wishlistSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.errors.map((e) => e.message).join(", "), 400);
    }

    const { productId } = parsed.data;

    const item = await db.wishlistItem.findUnique({
      where: { userId_productId: { userId: user.id, productId } },
    });

    if (!item) return apiError("Wishlist item not found", 404);

    await db.wishlistItem.delete({ where: { id: item.id } });
    return apiSuccess({ message: "Item removed from wishlist" });
  } catch (error) {
    return handleApiError(error);
  }
}
