import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/auth";
import { addressSchema } from "@/lib/validators/auth";
import { validateCoupon } from "@/services/product.service";
import { generateOrderNumber, calculateTax, calculateShipping } from "@/lib/utils";
import { appConfig } from "@/lib/env";
import { apiSuccess, apiError, handleApiError, parseSearchParams } from "@/lib/api-utils";

const createOrderSchema = z.object({
  shippingAddress: addressSchema,
  billingAddress: addressSchema,
  notes: z.string().optional(),
  couponCode: z.string().optional(),
});

function serializeOrder(order: {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: { toString(): string } | number;
  shippingCost: { toString(): string } | number;
  taxAmount: { toString(): string } | number;
  discountAmount: { toString(): string } | number;
  total: { toString(): string } | number;
  shippingAddress: unknown;
  billingAddress: unknown;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  items?: Array<{
    id: string;
    quantity: number;
    price: { toString(): string } | number;
    name: string;
    volume: string;
    image: string;
    product: { slug: string; id?: string };
  }>;
  payment?: { status: string; method: string; stripeSessionId?: string | null } | null;
  coupon?: { code: string } | null;
}) {
  return {
    ...order,
    subtotal: Number(order.subtotal),
    shippingCost: Number(order.shippingCost),
    taxAmount: Number(order.taxAmount),
    discountAmount: Number(order.discountAmount),
    total: Number(order.total),
    items: order.items?.map((item) => ({
      ...item,
      price: Number(item.price),
    })),
  };
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { getNum } = parseSearchParams(req.nextUrl.searchParams);
    const page = getNum("page") ?? 1;
    const limit = getNum("limit") ?? 10;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where: { userId: user.id },
        include: {
          items: {
            include: { product: { select: { slug: true, id: true } } },
          },
          payment: { select: { status: true, method: true } },
          coupon: { select: { code: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.order.count({ where: { userId: user.id } }),
    ]);

    return apiSuccess(orders.map(serializeOrder), 200, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.errors.map((e) => e.message).join(", "), 400);
    }

    const { shippingAddress, billingAddress, notes, couponCode } = parsed.data;

    const cartItems = await db.cartItem.findMany({
      where: { userId: user.id },
      include: {
        product: {
          include: { inventory: true },
        },
      },
    });

    if (cartItems.length === 0) {
      return apiError("Your cart is empty", 400);
    }

    for (const item of cartItems) {
      if (!item.product.active) {
        return apiError(`${item.product.name} is no longer available`, 400);
      }
      const stock = item.product.inventory?.quantity ?? 0;
      if (stock < item.quantity) {
        return apiError(`Insufficient stock for ${item.product.name}`, 400);
      }
    }

    const subtotal = cartItems.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0
    );

    let discountAmount = 0;
    let couponId: string | undefined;

    if (couponCode) {
      const couponResult = await validateCoupon(couponCode, subtotal);
      if (!couponResult.valid) {
        return apiError(couponResult.message, 400);
      }
      discountAmount = couponResult.discount;
      couponId = couponResult.couponId;
    }

    const discountedSubtotal = subtotal - discountAmount;
    const shippingCost = calculateShipping(
      discountedSubtotal,
      appConfig.freeShippingThreshold,
      appConfig.shippingFlatRate
    );
    const taxAmount = calculateTax(discountedSubtotal, appConfig.taxRate);
    const total = Math.round((discountedSubtotal + shippingCost + taxAmount) * 100) / 100;

    const order = await db.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId: user.id,
          subtotal,
          shippingCost,
          taxAmount,
          discountAmount,
          total,
          couponId,
          shippingAddress,
          billingAddress,
          notes,
          items: {
            create: cartItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price,
              name: item.product.name,
              volume: item.product.volume,
              image: item.product.thumbnail,
            })),
          },
          payment: {
            create: {
              amount: total,
              currency: appConfig.currency.toLowerCase(),
              status: "PENDING",
            },
          },
        },
        include: {
          items: { include: { product: { select: { slug: true, id: true } } } },
          payment: true,
          coupon: { select: { code: true } },
        },
      });

      return created;
    });

    return apiSuccess(serializeOrder(order), 201);
  } catch (error) {
    return handleApiError(error);
  }
}
