import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-utils";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const orders = await db.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      items: { take: 2 },
      payment: { select: { status: true, method: true } },
    },
  });

  const data = orders.map((order) => ({
    ...order,
    subtotal: Number(order.subtotal),
    shippingCost: Number(order.shippingCost),
    taxAmount: Number(order.taxAmount),
    discountAmount: Number(order.discountAmount),
    total: Number(order.total),
    createdAt: order.createdAt.toISOString(),
    items: order.items.map((item) => ({
      ...item,
      price: Number(item.price),
    })),
  }));

  return apiSuccess(data);
}
