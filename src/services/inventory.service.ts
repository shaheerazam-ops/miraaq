// services/inventory.service.ts

import { db } from "@/lib/db";

export const inventoryService = {
  async reduceInventoryForOrder(order: any) {
    try {
      console.log(`[Inventory] Reducing stock for order: ${order.id}`);

      if (!order.items) return;

      for (const item of order.items) {
        await db.inventory.updateMany({
          where: { productId: item.productId },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        });
      }

      return true;
    } catch (error) {
      console.error("[Inventory Reduce Error]", error);
      return false;
    }
  },

  async restoreInventoryForOrder(orderId: string) {
    try {
      console.log(`[Inventory] Restoring stock for order: ${orderId}`);

      const order = await db.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!order) return false;

      for (const item of order.items) {
        await db.inventory.updateMany({
          where: { productId: item.productId },
          data: {
            quantity: {
              increment: item.quantity,
            },
          },
        });
      }

      return true;
    } catch (error) {
      console.error("[Inventory Restore Error]", error);
      return false;
    }
  },
};