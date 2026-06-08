// ============================================================
// PayFast Pakistan - Primary Payment Gateway
// Docs: https://developers.payfast.co.za/api
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

interface PayFastConfig {
  merchantId: string;
  merchantKey: string;
  passphrase: string;
  isLive: boolean;
}

const PAYFAST_SANDBOX_URL = "https://sandbox.payfast.co.za/eng/process";
const PAYFAST_LIVE_URL = "https://www.payfast.co.za/eng/process";
const PAYFAST_SANDBOX_API = "https://api.payfast.co.za";
const PAYFAST_LIVE_API = "https://api.payfast.co.za";

export class PayFastGateway extends BasePaymentGateway {
  private payfastConfig: PayFastConfig;
  private baseUrl: string;
  private apiUrl: string;

  constructor() {
    const isLive = process.env.PAYFAST_MODE === "live";

    const config: GatewayConfig = {
      gatewayId: "payfast",
      displayName: "PayFast",
      supportedMethods: ["credit_card", "debit_card"],
      supportedCurrencies: ["PKR"],
      minAmount: 10,
      maxAmount: 1_000_000,
      isActive: true,
      isLive,
      logo: "/icons/payfast.svg",
      description: "Pay securely with Visa or Mastercard",
    };

    super(config);

    this.payfastConfig = {
      merchantId: process.env.PAYFAST_MERCHANT_ID!,
      merchantKey: process.env.PAYFAST_MERCHANT_KEY!,
      passphrase: process.env.PAYFAST_PASSPHRASE!,
      isLive,
    };

    this.baseUrl = isLive ? PAYFAST_LIVE_URL : PAYFAST_SANDBOX_URL;
    this.apiUrl = isLive ? PAYFAST_LIVE_API : PAYFAST_SANDBOX_API;
  }

  async initializePayment(
    request: PaymentInitRequest
  ): Promise<PaymentInitResponse> {
    try {
      const params: Record<string, string> = {
        merchant_id: this.payfastConfig.merchantId,
        merchant_key: this.payfastConfig.merchantKey,
        return_url: request.successUrl,
        cancel_url: request.cancelUrl,
        notify_url: request.webhookUrl,
        name_first: request.payer.name.split(" ")[0] || request.payer.name,
        name_last: request.payer.name.split(" ").slice(1).join(" ") || "",
        email_address: request.payer.email,
        m_payment_id: request.orderNumber,
        amount: request.amount.toFixed(2),
        item_name: request.description.substring(0, 100),
        item_description: request.description.substring(0, 255),
        custom_str1: request.orderId,
        custom_str2: request.orderNumber,
      };

      if (request.payer.phone) {
        params.cell_number = request.payer.phone.replace(/\D/g, "");
      }

      // Generate signature
      params.signature = this.generateSignature(params);

      return {
        success: true,
        gatewayOrderId: request.orderNumber,
        formFields: params,
        formAction: this.baseUrl,
        redirectUrl: this.baseUrl,
      };
    } catch (error) {
      console.error("[PayFast] initializePayment error:", error);
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
      // Verify via PayFast API
      const response = await fetch(
        `${this.apiUrl}/transactions/lookup/${request.gatewayTransactionId}`,
        {
          method: "GET",
          headers: {
            "merchant-id": this.payfastConfig.merchantId,
            "version": "v1",
            "timestamp": new Date().toISOString(),
            "signature": this.generateApiSignature("GET", "/transactions/lookup"),
          },
        }
      );

      if (!response.ok) {
        // Fallback: verify via webhook payload if passed
        if (request.webhookPayload) {
          return this.verifyFromWebhookPayload(request);
        }
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json() as {
        status: string;
        data?: {
          amount_gross: string;
          payment_status: string;
          pf_payment_id: string;
        };
      };

      const isCompleted = data?.data?.payment_status === "COMPLETE";

      return {
        success: true,
        verified: isCompleted,
        status: isCompleted ? "completed" : "pending",
        gatewayTransactionId: data?.data?.pf_payment_id || request.gatewayTransactionId,
        paidAmount: parseFloat(data?.data?.amount_gross || "0"),
        rawResponse: data as unknown as Record<string, unknown>,
      };
    } catch (error) {
      console.error("[PayFast] verifyPayment error:", error);
      return {
        success: false,
        verified: false,
        status: "failed",
        error: error instanceof Error ? error.message : "Verification failed",
      };
    }
  }

  private verifyFromWebhookPayload(
    request: PaymentVerifyRequest
  ): PaymentVerifyResponse {
    const payload = request.webhookPayload as Record<string, string>;
    const isCompleted = payload?.payment_status === "COMPLETE";
    const paidAmount = parseFloat(payload?.amount_gross || "0");

    // Verify amount matches
    const amountMatches = Math.abs(paidAmount - request.amount) < 0.01;

    return {
      success: true,
      verified: isCompleted && amountMatches,
      status: isCompleted ? "completed" : "failed",
      gatewayTransactionId: payload?.pf_payment_id || request.gatewayTransactionId,
      paidAmount,
      payerName: `${payload?.name_first || ""} ${payload?.name_last || ""}`.trim(),
      payerEmail: payload?.email_address,
      rawResponse: payload,
    };
  }

  async validateWebhook(
    payload: Record<string, unknown>,
    _headers: Record<string, string>,
    _rawBody: string
  ): Promise<WebhookValidationResult> {
    try {
      const data = payload as Record<string, string>;

      // Step 1: Reconstruct signature
      const receivedSignature = data.signature;
      const paramsWithoutSig = { ...data };
      delete paramsWithoutSig.signature;

      const calculatedSignature = this.generateSignature(paramsWithoutSig);

      if (receivedSignature !== calculatedSignature) {
        return {
          isValid: false,
          error: "Signature mismatch",
        };
      }

      // Step 2: Verify with PayFast server (ITN verification)
      const itnValid = await this.verifyITN(data);
      if (!itnValid) {
        return {
          isValid: false,
          error: "ITN verification failed",
        };
      }

      return {
        isValid: true,
        gatewayTransactionId: data.pf_payment_id,
        orderId: data.custom_str1,
        status: data.payment_status === "COMPLETE" ? "completed" : "failed",
        amount: parseFloat(data.amount_gross || "0"),
      };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : "Webhook validation failed",
      };
    }
  }

  private async verifyITN(data: Record<string, string>): Promise<boolean> {
    try {
      const params = new URLSearchParams(data);
      const response = await fetch(
        `${this.apiUrl}/eng/query/validate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: params.toString(),
        }
      );
      const text = await response.text();
      return text.trim() === "VALID";
    } catch {
      return false;
    }
  }

  async processRefund(request: RefundRequest): Promise<RefundResponse> {
    try {
      const timestamp = new Date().toISOString();
      const response = await fetch(
        `${this.apiUrl}/transactions/refund`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "merchant-id": this.payfastConfig.merchantId,
            "version": "v1",
            "timestamp": timestamp,
            "signature": this.generateApiSignature("POST", "/transactions/refund"),
          },
          body: JSON.stringify({
            transaction_id: request.gatewayTransactionId,
            amount: request.refundAmount.toFixed(2),
            reason: request.reason,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Refund API returned ${response.status}`);
      }

      const data = await response.json() as { data?: { refund_id?: string } };

      return {
        success: true,
        refundId: data?.data?.refund_id,
        refundedAmount: request.refundAmount,
        status: "processing",
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
        `${this.apiUrl}/transactions/lookup/${request.gatewayTransactionId}`,
        {
          headers: {
            "merchant-id": this.payfastConfig.merchantId,
            "version": "v1",
            "timestamp": new Date().toISOString(),
          },
        }
      );

      if (!response.ok) {
        return { found: false };
      }

      const data = await response.json() as {
        data?: {
          payment_status: string;
          amount_gross: string;
          created_at: string;
        };
      };

      return {
        found: true,
        status: data?.data?.payment_status === "COMPLETE" ? "completed" : "pending",
        amount: parseFloat(data?.data?.amount_gross || "0"),
        paidAt: data?.data?.created_at ? new Date(data.data.created_at) : undefined,
      };
    } catch {
      return { found: false };
    }
  }

  // ---- Private Helpers ----

  private generateSignature(params: Record<string, string>): string {
    // Sort and build query string
    const sorted = Object.keys(params)
      .sort()
      .filter((k) => params[k] !== "" && params[k] !== undefined)
      .map((k) => `${k}=${encodeURIComponent(params[k]).replace(/%20/g, "+")}`)
      .join("&");

    const withPassphrase = this.payfastConfig.passphrase
      ? `${sorted}&passphrase=${encodeURIComponent(this.payfastConfig.passphrase)}`
      : sorted;

    return crypto.createHash("md5").update(withPassphrase).digest("hex");
  }

  private generateApiSignature(method: string, endpoint: string): string {
    const timestamp = new Date().toISOString();
    const toSign = `${method.toUpperCase()}\n${endpoint}\n${timestamp}\n${this.payfastConfig.merchantId}`;
    return crypto
      .createHmac("sha256", this.payfastConfig.passphrase)
      .update(toSign)
      .digest("hex");
  }
}