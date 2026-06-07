import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-utils";

const addToCartSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(99).default(1),
});

const removeFromCartSchema = z.object({
  productId: z.string().min(1).optional(),
  clearAll: z.boolean().optional(),
});

function serializeCartItem(item: {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    price: { toString(): string } | number;
    comparePrice: { toString(): string } | number | null;
    thumbnail: string;
    volume: string;
    active: boolean;
    inventory: { quantity: number } | null;
  };
}) {
  return {
    id: item.id,
    quantity: item.quantity,
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

    const items = await db.cartItem.findMany({
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
            active: true,
            inventory: { select: { quantity: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const serialized = items.map(serializeCartItem);
    const subtotal = serialized.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

    return apiSuccess({ items: serialized, subtotal, itemCount: serialized.length });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const parsed = addToCartSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.errors.map((e) => e.message).join(", "), 400);
    }

    const { productId, quantity } = parsed.data;

    const product = await db.product.findUnique({
      where: { id: productId, active: true },
      include: { inventory: true },
    });

    if (!product) return apiError("Product not found", 404);

    const available = product.inventory?.quantity ?? 0;
    if (available < 1) return apiError("Product is out of stock", 400);

    const existing = await db.cartItem.findUnique({
      where: { userId_productId: { userId: user.id, productId } },
    });

    const newQuantity = (existing?.quantity ?? 0) + quantity;
    if (newQuantity > available) {
      return apiError(`Only ${available} items available in stock`, 400);
    }

    const cartItem = await db.cartItem.upsert({
      where: { userId_productId: { userId: user.id, productId } },
      create: { userId: user.id, productId, quantity },
      update: { quantity: newQuantity },
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
            active: true,
            inventory: { select: { quantity: true } },
          },
        },
      },
    });

    return apiSuccess(serializeCartItem(cartItem), existing ? 200 : 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const parsed = removeFromCartSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.errors.map((e) => e.message).join(", "), 400);
    }

    const { productId, clearAll } = parsed.data;

    if (clearAll) {
      await db.cartItem.deleteMany({ where: { userId: user.id } });
      return apiSuccess({ message: "Cart cleared" });
    }

    if (!productId) {
      return apiError("productId is required unless clearAll is true", 400);
    }

    const item = await db.cartItem.findUnique({
      where: { userId_productId: { userId: user.id, productId } },
    });

    if (!item) return apiError("Cart item not found", 404);

    await db.cartItem.delete({ where: { id: item.id } });
    return apiSuccess({ message: "Item removed from cart" });
  } catch (error) {
    return handleApiError(error);
  }
}
