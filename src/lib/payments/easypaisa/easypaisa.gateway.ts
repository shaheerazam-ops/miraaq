// ============================================================
// Easypaisa - Mobile Wallet Payment Gateway
// ============================================================

import crypto from "crypto";
import {
  BasePaymentGateway,
  PaymentInitRequest,
  PaymentInitResponse,
  PaymentVerifyRequest,
  PaymentVerifyResponse,
  RefundRequest,
  RefundResponse,
  TransactionStatusRequest,
  TransactionStatusResponse,
  WebhookValidationResult,
  GatewayConfig,
} from "../abstractions/gateway.interface";

const EASYPAISA_SANDBOX_URL = "https://easypaystg.easypaisa.com.pk";
const EASYPAISA_LIVE_URL = "https://easypay.easypaisa.com.pk";

export class EasypaisaGateway extends BasePaymentGateway {
  private storeId: string;
  private hashKey: string;
  private apiBaseUrl: string;

  constructor() {
    const isLive = process.env.EASYPAISA_MODE === "production";

    const config: GatewayConfig = {
      gatewayId: "easypaisa",
      displayName: "Easypaisa",
      supportedMethods: ["wallet"],
      supportedCurrencies: ["PKR"],
      minAmount: 1,
      maxAmount: 500000,
      isActive: Boolean(
        process.env.EASYPAISA_STORE_ID && process.env.EASYPAISA_HASH_KEY
      ),
      isLive,
      description: "Easypaisa Mobile Wallet",
    };

    super(config);

    this.storeId = process.env.EASYPAISA_STORE_ID || "";
    this.hashKey = process.env.EASYPAISA_HASH_KEY || "";
    this.apiBaseUrl = isLive
      ? EASYPAISA_LIVE_URL
      : EASYPAISA_SANDBOX_URL;
  }

  // ============================================================
  // REQUIRED BASE METHODS (already handled by abstract class)
  // ============================================================

  // ============================================================
  // INIT PAYMENT
  // ============================================================
  async initializePayment(
    request: PaymentInitRequest
  ): Promise<PaymentInitResponse> {
    try {
      const expiry = new Date();
      expiry.setHours(expiry.getHours() + 1);

      const pad = (n: number) => String(n).padStart(2, "0");

      const formatDate = (date: Date) =>
        date.getFullYear().toString() +
        pad(date.getMonth() + 1) +
        pad(date.getDate()) +
        pad(date.getHours()) +
        pad(date.getMinutes()) +
        pad(date.getSeconds());

      const params: Record<string, string> = {
        storeId: this.storeId,
        amount: this.formatAmount(request.amount, true).toString(),
        postBackURL: request.successUrl,
        orderRefNum: request.orderNumber,
        expiryDate: formatDate(expiry),
        autoRedirect: "0",
        mobileNum:
          request.payer.phone?.replace(/^\+92/, "0").replace(/\D/g, "") || "",
        emailAddr: request.payer.email,
      };

      params.hash = this.generateHash(params);

      const redirectUrl = new URL(
        `${this.apiBaseUrl}/easypay/#!/login`
      );

      Object.entries(params).forEach(([k, v]) =>
        redirectUrl.searchParams.set(k, v)
      );

      return {
        success: true,
        gatewayOrderId: request.orderNumber,
        redirectUrl: redirectUrl.toString(),
        deepLink: `easypaisa://payment?merchantId=${this.storeId}&amount=${params.amount}&orderRef=${request.orderNumber}`,
        formFields: params,
        formAction: `${this.apiBaseUrl}/easypay`,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "INIT FAILED",
        errorCode: "INIT_FAILED",
      };
    }
  }

  // ============================================================
  // VERIFY PAYMENT
  // ============================================================
  async verifyPayment(
    request: PaymentVerifyRequest
  ): Promise<PaymentVerifyResponse> {
    try {
      const pad = (n: number) => String(n).padStart(2, "0");

      const now = new Date();
      const transactionDateTime =
        now.getFullYear().toString() +
        pad(now.getMonth() + 1) +
        pad(now.getDate()) +
        pad(now.getHours()) +
        pad(now.getMinutes()) +
        pad(now.getSeconds());

      const params: Record<string, string> = {
        storeId: this.storeId,
        orderId: request.gatewayOrderId || request.orderId,
        transactionDateTime,
      };

      params.hash = this.generateHash(params);

      const response = await fetch(
        `${this.apiBaseUrl}/easypay/api/private/orderStatus`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Credentials: Buffer.from(
              `${this.storeId}:${this.hashKey}`
            ).toString("base64"),
          },
          body: new URLSearchParams(params).toString(),
        }
      );

      const data = await response.json();

      const ok = data?.responseCode === "0000";

      return {
        success: true,
        verified: ok,
        status: ok ? "completed" : "failed",
        gatewayTransactionId: data?.transactionId,
        paidAmount: data?.amount
          ? Number(data.amount) / 100
          : undefined,
        rawResponse: data,
      };
    } catch (err) {
      return {
        success: false,
        verified: false,
        status: "failed",
        error:
          err instanceof Error ? err.message : "VERIFY FAILED",
      };
    }
  }

  // ============================================================
  // WEBHOOK VALIDATION (UPDATED SIGNATURE)
  // ============================================================
  async validateWebhook(
    payload: Record<string, unknown>,
    headers: Record<string, string>,
    rawBody: string
  ): Promise<WebhookValidationResult> {
    try {
      const data = payload as Record<string, string>;

      const receivedHash = data.hash;
      const clone = { ...data };
      delete clone.hash;

      const expectedHash = this.generateHash(clone);

      if (receivedHash !== expectedHash) {
        return { isValid: false, error: "Hash mismatch" };
      }

      const ok = data.responseCode === "0000";

      return {
        isValid: true,
        gatewayTransactionId: data.transactionId,
        orderId: data.orderRefNum,
        status: ok ? "completed" : "failed",
        amount: data.amount ? Number(data.amount) / 100 : undefined,
      };
    } catch (err) {
      return {
        isValid: false,
        error:
          err instanceof Error ? err.message : "WEBHOOK ERROR",
      };
    }
  }

  // ============================================================
  // REFUND (REQUIRED SIGNATURE)
  // ============================================================
  async processRefund(
    request: RefundRequest
  ): Promise<RefundResponse> {
    return {
      success: false,
      status: "failed",
      error: "Easypaisa refunds must be handled manually",
    };
  }

  // ============================================================
  // TRANSACTION STATUS
  // ============================================================
  async getTransactionStatus(
    request: TransactionStatusRequest
  ): Promise<TransactionStatusResponse> {
    try {
      const pad = (n: number) => String(n).padStart(2, "0");

      const now = new Date();
      const transactionDateTime =
        now.getFullYear().toString() +
        pad(now.getMonth() + 1) +
        pad(now.getDate()) +
        pad(now.getHours()) +
        pad(now.getMinutes()) +
        pad(now.getSeconds());

      const params: Record<string, string> = {
        storeId: this.storeId,
        orderId: request.orderId || "",
        transactionDateTime,
      };

      params.hash = this.generateHash(params);

      const response = await fetch(
        `${this.apiBaseUrl}/easypay/api/private/orderStatus`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams(params).toString(),
        }
      );

      const data = await response.json();

      return {
        found: true,
        status:
          data?.responseCode === "0000"
            ? "completed"
            : "pending",
        amount: data?.amount
          ? Number(data.amount) / 100
          : undefined,
      };
    } catch {
      return { found: false };
    }
  }

  // ============================================================
  // HASH GENERATION
  // ============================================================
  private generateHash(
    params: Record<string, string>
  ): string {
    const sorted = Object.keys(params)
      .filter((k) => params[k])
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join("&");

    return crypto
      .createHmac("sha256", this.hashKey)
      .update(sorted)
      .digest("hex")
      .toUpperCase();
  }
}