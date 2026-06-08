// ============================================================
// HBL Pay - HBL Bank Payment Gateway
// Pakistan's largest bank payment processing
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

const HBLPAY_SANDBOX_URL = "https://sandbox.hblpay.pk/api/v1";
const HBLPAY_LIVE_URL = "https://api.hblpay.pk/api/v1";

export class HBLPayGateway extends BasePaymentGateway {
  private merchantId: string;
  private apiKey: string;
  private apiSecret: string;
  private apiBaseUrl: string;

  constructor() {
    const isLive = process.env.HBLPAY_MODE === "production";

    const config: GatewayConfig = {
      gatewayId: "hblpay",
      displayName: "HBL Pay",
      supportedMethods: ["credit_card", "debit_card"],
      supportedCurrencies: ["PKR"],
      minAmount: 1,
      maxAmount: 2_000_000,
      isActive: true,
      isLive,
      logo: "/icons/hblpay.svg",
      description: "Pay securely with HBL Bank",
    };

    super(config);

    this.merchantId = process.env.HBLPAY_MERCHANT_ID!;
    this.apiKey = process.env.HBLPAY_API_KEY!;
    this.apiSecret = process.env.HBLPAY_API_SECRET!;
    this.apiBaseUrl = isLive ? HBLPAY_LIVE_URL : HBLPAY_SANDBOX_URL;
  }

  private getAuthHeaders(body: string = ""): Record<string, string> {
    const timestamp = new Date().toISOString();
    const nonce = crypto.randomUUID();
    const toSign = `${this.apiKey}${timestamp}${nonce}${body}`;
    const signature = crypto
      .createHmac("sha256", this.apiSecret)
      .update(toSign)
      .digest("base64");

    return {
      "Content-Type": "application/json",
      "X-HBL-API-KEY": this.apiKey,
      "X-HBL-MERCHANT-ID": this.merchantId,
      "X-HBL-TIMESTAMP": timestamp,
      "X-HBL-NONCE": nonce,
      "X-HBL-SIGNATURE": signature,
    };
  }

  async initializePayment(
    request: PaymentInitRequest
  ): Promise<PaymentInitResponse> {
    try {
      const payload = {
        merchant_id: this.merchantId,
        order_id: request.orderNumber,
        internal_order_id: request.orderId,
        amount: Math.round(request.amount * 100), // Paisa
        currency: "PKR",
        description: request.description,
        customer: {
          name: request.payer.name,
          email: request.payer.email,
          phone: request.payer.phone,
        },
        callback_url: request.successUrl,
        failure_url: request.failureUrl,
        cancel_url: request.cancelUrl,
        webhook_url: request.webhookUrl,
        metadata: request.metadata,
      };

      const body = JSON.stringify(payload);
      const response = await fetch(`${this.apiBaseUrl}/payments/initiate`, {
        method: "POST",
        headers: this.getAuthHeaders(body),
        body,
      });

      if (!response.ok) {
        const error = await response.json() as { message?: string; error?: string };
        throw new Error(error.message || error.error || `HTTP ${response.status}`);
      }

      const data = await response.json() as {
        transaction_id?: string;
        checkout_url?: string;
        session_token?: string;
      };

      return {
        success: true,
        gatewayTransactionId: data.transaction_id,
        gatewayOrderId: request.orderNumber,
        redirectUrl: data.checkout_url,
      };
    } catch (error) {
      console.error("[HBLPay] initializePayment error:", error);
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
        `${this.apiBaseUrl}/payments/${request.gatewayTransactionId}/status`,
        { headers: this.getAuthHeaders() }
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
        customer?: { name?: string; email?: string; phone?: string };
        card?: { brand?: string; last4?: string; bin?: string };
        gateway_reference?: string;
      };

      const isCompleted = data?.status === "SUCCESS" || data?.status === "PAID";

      return {
        success: true,
        verified: isCompleted,
        status: isCompleted ? "completed" : (data?.status === "FAILED" ? "failed" : "pending"),
        gatewayTransactionId: request.gatewayTransactionId,
        gatewayReference: data?.gateway_reference,
        paidAmount: data?.amount ? data.amount / 100 : undefined,
        paidAt: data?.paid_at ? new Date(data.paid_at) : undefined,
        gatewayFee: data?.fee ? data.fee / 100 : undefined,
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
      const signature = headers["x-hbl-signature"];
      const timestamp = headers["x-hbl-timestamp"];
      const nonce = headers["x-hbl-nonce"];

      if (!signature || !timestamp || !nonce) {
        return { isValid: false, error: "Missing webhook headers" };
      }

      // Replay attack prevention (5 minutes)
      const ts = new Date(timestamp).getTime();
      if (Math.abs(Date.now() - ts) > 5 * 60 * 1000) {
        return { isValid: false, error: "Webhook timestamp expired" };
      }

      const toVerify = `${this.apiKey}${timestamp}${nonce}${rawBody}`;
      const expectedSignature = crypto
        .createHmac("sha256", this.apiSecret)
        .update(toVerify)
        .digest("base64");

      if (
        !crypto.timingSafeEqual(
          Buffer.from(signature),
          Buffer.from(expectedSignature)
        )
      ) {
        return { isValid: false, error: "Signature mismatch" };
      }

      const data = payload as {
        event?: string;
        data?: {
          transaction_id?: string;
          order_id?: string;
          internal_order_id?: string;
          status?: string;
          amount?: number;
        };
      };

      const txn = data?.data;
      const isCompleted = txn?.status === "SUCCESS" || txn?.status === "PAID";

      return {
        isValid: true,
        gatewayTransactionId: txn?.transaction_id,
        orderId: txn?.internal_order_id || txn?.order_id,
        status: isCompleted ? "completed" : "failed",
        amount: txn?.amount ? txn.amount / 100 : undefined,
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
        transaction_id: request.gatewayTransactionId,
        amount: request.isPartial ? Math.round(request.refundAmount * 100) : undefined,
        reason: request.reason,
      };

      const body = JSON.stringify(payload);
      const response = await fetch(`${this.apiBaseUrl}/payments/refund`, {
        method: "POST",
        headers: this.getAuthHeaders(body),
        body,
      });

      if (!response.ok) {
        const error = await response.json() as { message?: string };
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      const data = await response.json() as { refund_id?: string; amount?: number };

      return {
        success: true,
        refundId: data.refund_id,
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
        `${this.apiBaseUrl}/payments/${request.gatewayTransactionId}/status`,
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
        status: ["SUCCESS", "PAID"].includes(data.status || "") ? "completed" : "pending",
        amount: data.amount ? data.amount / 100 : undefined,
        paidAt: data.paid_at ? new Date(data.paid_at) : undefined,
      };
    } catch {
      return { found: false };
    }
  }
}