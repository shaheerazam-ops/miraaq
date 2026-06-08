// ============================================================
// Safepay Pakistan - Secondary Payment Gateway
// Docs: https://docs.getsafepay.com
// ============================================================

import crypto from "crypto";
import {
  BasePaymentGateway,
  GatewayConfig,
  PaymentInitRequest,
  PaymentInitResponse,
  PaymentVerifyRequest,
  PaymentVerifyResponse,
  RefundRequest,
  RefundResponse,
  TransactionStatusRequest,
  TransactionStatusResponse,
  WebhookValidationResult,
} from "../abstractions/gateway.interface";

const SAFEPAY_SANDBOX_URL = "https://sandbox.api.getsafepay.com";
const SAFEPAY_LIVE_URL = "https://api.getsafepay.com";

export class SafepayGateway extends BasePaymentGateway {
  private apiKey: string;
  private apiSecret: string;
  private apiBaseUrl: string;

  constructor() {
    const isLive = process.env.SAFEPAY_MODE === "production";

    const config: GatewayConfig = {
      gatewayId: "safepay",
      displayName: "Safepay",
      supportedMethods: ["credit_card", "debit_card"],
      supportedCurrencies: ["PKR"],
      minAmount: 1,
      maxAmount: 500_000,
      isActive: true,
      isLive,
      logo: "/icons/safepay.svg",
      description: "Pakistan's secure payment gateway",
    };

    super(config);

    this.apiKey = process.env.SAFEPAY_API_KEY!;
    this.apiSecret = process.env.SAFEPAY_API_SECRET!;
    this.apiBaseUrl = isLive ? SAFEPAY_LIVE_URL : SAFEPAY_SANDBOX_URL;
  }

  private getAuthHeaders(body?: string): Record<string, string> {
    const timestamp = Date.now().toString();
    const nonce = crypto.randomBytes(16).toString("hex");
    const toSign = `${timestamp}\n${nonce}\n${body || ""}`;
    const signature = crypto
      .createHmac("sha256", this.apiSecret)
      .update(toSign)
      .digest("base64");

    return {
      "Content-Type": "application/json",
      "X-SFPY-API-KEY": this.apiKey,
      "X-SFPY-TIMESTAMP": timestamp,
      "X-SFPY-NONCE": nonce,
      "X-SFPY-SIGNATURE": signature,
    };
  }

  async initializePayment(
    request: PaymentInitRequest
  ): Promise<PaymentInitResponse> {
    try {
      const payload = {
        amount: Math.round(request.amount * 100), // In paisa
        currency: request.currency,
        order_id: request.orderNumber,
        redirect_url: request.successUrl,
        cancel_url: request.cancelUrl,
        webhook_url: request.webhookUrl,
        customer: {
          name: request.payer.name,
          email: request.payer.email,
          phone: request.payer.phone,
        },
        description: request.description,
        metadata: {
          internal_order_id: request.orderId,
          ...request.metadata,
        },
      };

      const body = JSON.stringify(payload);
      const response = await fetch(`${this.apiBaseUrl}/v1/payments/session`, {
        method: "POST",
        headers: this.getAuthHeaders(body),
        body,
      });

      if (!response.ok) {
        const error = await response.json() as { message?: string };
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      const data = await response.json() as {
        token?: string;
        redirect_url?: string;
      };

      return {
        success: true,
        gatewayTransactionId: data.token,
        redirectUrl: data.redirect_url,
      };
    } catch (error) {
      console.error("[Safepay] initializePayment error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Payment initialization failed",
        errorCode: "INIT_FAILED",
      };
    }
  }

  async verifyPayment(
    request: PaymentVerifyRequest
  ): Promise<PaymentVerifyResponse> {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/v1/payments/${request.gatewayTransactionId}`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json() as {
        status?: string;
        amount?: number;
        currency?: string;
        paid_at?: string;
        fee?: number;
        net?: number;
        customer?: {
          name?: string;
          email?: string;
          phone?: string;
        };
        card?: {
          brand?: string;
          last4?: string;
        };
      };

      const isCompleted = data?.status === "paid";

      return {
        success: true,
        verified: isCompleted,
        status: isCompleted ? "completed" : (data?.status === "failed" ? "failed" : "pending"),
        gatewayTransactionId: request.gatewayTransactionId,
        paidAmount: data?.amount ? data.amount / 100 : undefined,
        paidAt: data?.paid_at ? new Date(data.paid_at) : undefined,
        gatewayFee: data?.fee ? data.fee / 100 : undefined,
        netAmount: data?.net ? data.net / 100 : undefined,
        payerName: data?.customer?.name,
        payerEmail: data?.customer?.email,
        payerPhone: data?.customer?.phone,
        cardBrand: data?.card?.brand,
        maskedCard: data?.card?.last4 ? `**** **** **** ${data.card.last4}` : undefined,
        rawResponse: data as Record<string, unknown>,
      };
    } catch (error) {
      return {
        success: false,
        verified: false,
        status: "failed",
        error: error instanceof Error ? error.message : "Verification failed",
      };
    }
  }

  async validateWebhook(
    payload: Record<string, unknown>,
    headers: Record<string, string>,
    rawBody: string
  ): Promise<WebhookValidationResult> {
    try {
      const signature = headers["x-sfpy-signature"];
      const timestamp = headers["x-sfpy-timestamp"];

      if (!signature || !timestamp) {
        return { isValid: false, error: "Missing webhook headers" };
      }

      // Validate timestamp (prevent replay attacks - 5 min window)
      const ts = parseInt(timestamp, 10);
      const now = Date.now();
      if (Math.abs(now - ts) > 5 * 60 * 1000) {
        return { isValid: false, error: "Webhook timestamp expired" };
      }

      // Validate signature
      const expectedSignature = crypto
        .createHmac("sha256", process.env.SAFEPAY_WEBHOOK_SECRET!)
        .update(`${timestamp}.${rawBody}`)
        .digest("hex");

      if (
        !crypto.timingSafeEqual(
          Buffer.from(signature),
          Buffer.from(expectedSignature)
        )
      ) {
        return { isValid: false, error: "Invalid signature" };
      }

      const data = payload as {
        type?: string;
        data?: {
          object?: {
            id?: string;
            status?: string;
            amount?: number;
            metadata?: { internal_order_id?: string };
          };
        };
      };

      const payment = data?.data?.object;

      return {
        isValid: true,
        gatewayTransactionId: payment?.id,
        orderId: payment?.metadata?.internal_order_id,
        status: payment?.status === "paid" ? "completed" : "failed",
        amount: payment?.amount ? payment.amount / 100 : undefined,
      };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : "Webhook validation failed",
      };
    }
  }

  async processRefund(request: RefundRequest): Promise<RefundResponse> {
    try {
      const payload = {
        amount: request.isPartial
          ? Math.round(request.refundAmount * 100)
          : undefined,
        reason: request.reason,
      };

      const body = JSON.stringify(payload);
      const response = await fetch(
        `${this.apiBaseUrl}/v1/payments/${request.gatewayTransactionId}/refund`,
        {
          method: "POST",
          headers: this.getAuthHeaders(body),
          body,
        }
      );

      if (!response.ok) {
        const error = await response.json() as { message?: string };
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      const data = await response.json() as { id?: string; amount?: number };

      return {
        success: true,
        refundId: data.id,
        refundedAmount: data.amount ? data.amount / 100 : request.refundAmount,
        status: "completed",
        processedAt: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        status: "failed",
        error: error instanceof Error ? error.message : "Refund failed",
      };
    }
  }

  async getTransactionStatus(
    request: TransactionStatusRequest
  ): Promise<TransactionStatusResponse> {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/v1/payments/${request.gatewayTransactionId}`,
        { headers: this.getAuthHeaders() }
      );

      if (!response.ok) return { found: false };

      const data = await response.json() as {
        status?: string;
        amount?: number;
        paid_at?: string;
      };

      return {
        found: true,
        status: data.status === "paid" ? "completed" : "pending",
        amount: data.amount ? data.amount / 100 : undefined,
        paidAt: data.paid_at ? new Date(data.paid_at) : undefined,
      };
    } catch {
      return { found: false };
    }
  }
}