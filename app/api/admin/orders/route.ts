import { NextRequest } from "next/server";
import { OrderStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/auth";
import { apiSuccess, handleApiError, parseSearchParams } from "@/lib/api-utils";

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
  user: { id: string; name: string | null; email: string };
  items: Array<{
    id: string;
    quantity: number;
    price: { toString(): string } | number;
    name: string;
    volume: string;
    image: string;
  }>;
  payment?: { status: string; method: string } | null;
  coupon?: { code: string } | null;
}) {
  return {
    ...order,
    subtotal: Number(order.subtotal),
    shippingCost: Number(order.shippingCost),
    taxAmount: Number(order.taxAmount),
    discountAmount: Number(order.discountAmount),
    total: Number(order.total),
    items: order.items.map((item) => ({
      ...item,
      price: Number(item.price),
    })),
  };
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { get, getNum } = parseSearchParams(req.nextUrl.searchParams);
    const page = getNum("page") ?? 1;
    const limit = getNum("limit") ?? 20;
    const status = get("status");
    const search = get("search");
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {};

    if (status && Object.values(OrderStatus).includes(status as OrderStatus)) {
      where.status = status as OrderStatus;
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { user: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: true,
          payment: { select: { status: true, method: true } },
          coupon: { select: { code: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.order.count({ where }),
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
