import { db as prisma } from "@/lib/db";
import { PaymentGatewayRegistry } from "@/lib/payments/abstractions/gateway.registry";
import {
  PaymentGatewayId,
  PaymentInitRequest,
  PaymentVerifyRequest,
  RefundRequest,
  WebhookValidationResult,
} from "@/lib/payments/abstractions/gateway.interface";

import {
  PaymentMethod,
  PaymentStatus,
  PaymentGateway,
} from "@prisma/client";

import { generateInvoice } from "@/services/invoice.service";
import { notificationService } from "@/services/notifications.services";
import { inventoryService } from "@/services/inventory.service";

export class PaymentService {

  // ---------------- INITIATE ----------------
  async initiatePayment(input: any) {
    const { orderId, userId, gateway, amount, payer } = input;

    const order = await prisma.order.findUnique({
      where: { id: orderId, userId },
      include: { items: true },
    });

    if (!order) return { success: false, error: "Order not found" };

    const gatewayInstance = PaymentGatewayRegistry.getGateway(gateway);

    const payment = await prisma.payment.create({
      data: {
        orderId,
        amount,
        currency: "PKR",

        // ✅ FIX: must be Prisma enum
        status: PaymentStatus.PENDING,

        // ✅ FIX: must be Prisma enum
        method: this.gatewayToMethod(gateway),

        // ✅ FIX: convert string → enum safely
        gateway: this.mapGateway(gateway),

        payerName: payer?.name,
        payerEmail: payer?.email,
        payerPhone: payer?.phone,
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL!;

    const gatewayRequest: PaymentInitRequest = {
      orderId,
      orderNumber: order.orderNumber,
      amount,
      currency: "PKR",
      payer,
      description: `Order #${order.orderNumber}`,
      successUrl: `${baseUrl}/success`,
      failureUrl: `${baseUrl}/failure`,
      cancelUrl: `${baseUrl}/cart`,
      webhookUrl: `${baseUrl}/api/webhooks/${gateway}`,
      metadata: { paymentId: payment.id },
    };

    const response = await gatewayInstance.initializePayment(gatewayRequest);

    if (!response.success) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
        },
      });

      return { success: false, error: response.error };
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.PROCESSING,
        gatewayRef: response.gatewayTransactionId ?? null,
        sessionRef: response.gatewayOrderId ?? null,
      },
    });

    return {
      success: true,
      paymentId: payment.id,
      redirectUrl: response.redirectUrl,
    };
  }

  // ---------------- VERIFY ----------------
  async verifyPayment(paymentId: string, gateway: any, callbackData?: any) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true },
    });

    if (!payment) return { success: false };

    const gatewayInstance = PaymentGatewayRegistry.getGateway(gateway);

    const res = await gatewayInstance.verifyPayment({
      gatewayTransactionId: payment.gatewayRef ?? "",
      orderId: payment.orderId,
      amount: Number(payment.amount),
      webhookPayload: callbackData,
    });

    if (res.verified && res.status === "completed") {
      await this.completePayment(payment.id, res);
      return { success: true };
    }

    return { success: false };
  }

  // ---------------- COMPLETE ----------------
  private async completePayment(paymentId: string, data: any) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: { include: { items: true } } },
    });

    if (!payment) return;

    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.PAID,
        gatewayRef: data.gatewayTransactionId,
      },
    });

    await prisma.order.update({
      where: { id: payment.orderId },
      data: {
        status: "CONFIRMED",
      },
    });

    await inventoryService.reduceInventoryForOrder(payment.order);
    await generateInvoice(payment.orderId);
    await notificationService.sendOrderConfirmationNotification(payment.order);
  }

  // ---------------- FIX: gateway mapper ----------------
  private mapGateway(gateway: string): PaymentGateway {
    const map: Record<string, PaymentGateway> = {
      payfast: PaymentGateway.PAYFAST,
      safepay: PaymentGateway.SAFEPAY,
      hblpay: PaymentGateway.HBLPAY,
      easypaisa: PaymentGateway.EASYPAISA,
      jazzcash: PaymentGateway.JAZZCASH,
      cod: PaymentGateway.COD,
    };

    return map[gateway] ?? PaymentGateway.PAYFAST;
  }

  private gatewayToMethod(gateway: string): PaymentMethod {
    const map: Record<string, PaymentMethod> = {
      easypaisa: PaymentMethod.EASYPAISA_WALLET,
      jazzcash: PaymentMethod.JAZZCASH_WALLET,
    };

    return map[gateway] ?? PaymentMethod.CREDIT_CARD;
  }
}

export const paymentService = new PaymentService();