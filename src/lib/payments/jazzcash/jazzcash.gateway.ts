// ============================================================
// JazzCash - Mobile Money Payment Gateway
// Pakistan's leading telecom-based payment service
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

const JAZZCASH_SANDBOX_URL =
  "https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform";
const JAZZCASH_LIVE_URL =
  "https://payments.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform";
const JAZZCASH_SANDBOX_API = "https://sandbox.jazzcash.com.pk/ApplicationAPI/API";
const JAZZCASH_LIVE_API = "https://payments.jazzcash.com.pk/ApplicationAPI/API";

export class JazzCashGateway extends BasePaymentGateway {
  private merchantId: string;
  private password: string;
  private integritySalt: string;
  private postUrl: string;
  private apiUrl: string;

  constructor() {
    const isLive = process.env.JAZZCASH_MODE === "production";

    const config: GatewayConfig = {
      gatewayId: "jazzcash",
      displayName: "JazzCash",
      supportedMethods: ["jazzcash_wallet"],
      supportedCurrencies: ["PKR"],
      minAmount: 10,
      maxAmount: 25_000,
      isActive: true,
      isLive,
      logo: "/icons/jazzcash.svg",
      description: "Pay with your JazzCash mobile account",
    };

    super(config);

    this.merchantId = process.env.JAZZCASH_MERCHANT_ID!;
    this.password = process.env.JAZZCASH_PASSWORD!;
    this.integritySalt = process.env.JAZZCASH_INTEGRITY_SALT!;
    this.postUrl = isLive ? JAZZCASH_LIVE_URL : JAZZCASH_SANDBOX_URL;
    this.apiUrl = isLive ? JAZZCASH_LIVE_API : JAZZCASH_SANDBOX_API;
  }

  async initializePayment(
    request: PaymentInitRequest
  ): Promise<PaymentInitResponse> {
    try {
      const now = new Date();
      const expire = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour expiry

      const formatDateTime = (d: Date): string => {
        const pad = (n: number) => String(n).padStart(2, "0");
        return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      };

      // JazzCash amount is in PKR without decimals
      const amount = Math.round(request.amount).toString();

      const txnRefNo = `T${Date.now()}-${request.orderNumber.replace(/[^a-zA-Z0-9]/g, "")}`.substring(0, 30);

      const params: Record<string, string> = {
        pp_Version: "1.1",
        pp_TxnType: "MWALLET",
        pp_Language: "EN",
        pp_MerchantID: this.merchantId,
        pp_Password: this.password,
        pp_TxnRefNo: txnRefNo,
        pp_Amount: (parseInt(amount) * 100).toString(), // In paisa
        pp_TxnCurrency: "PKR",
        pp_TxnDateTime: formatDateTime(now),
        pp_BillReference: request.orderNumber,
        pp_Description: request.description.substring(0, 100),
        pp_TxnExpiryDateTime: formatDateTime(expire),
        pp_ReturnURL: request.successUrl,
        pp_SecureHash: "",
      };

      if (request.payer.phone) {
        params.pp_MobileNumber = request.payer.phone
          .replace(/^\+92/, "92")
          .replace(/\D/g, "");
      }

      // Generate secure hash
      params.pp_SecureHash = this.generateSecureHash(params);

      const deepLink = `jazzcash://payment?merchantId=${this.merchantId}&amount=${params.pp_Amount}&ref=${txnRefNo}`;

      return {
        success: true,
        gatewayTransactionId: txnRefNo,
        gatewayOrderId: request.orderNumber,
        redirectUrl: this.postUrl,
        formFields: params,
        formAction: this.postUrl,
        deepLink,
      };
    } catch (error) {
      console.error("[JazzCash] initializePayment error:", error);
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
      const payload = {
        pp_TxnRefNo: request.gatewayTransactionId,
        pp_MerchantID: this.merchantId,
        pp_Password: this.password,
      };

      const secureHash = this.generateSecureHash(payload);

      const response = await fetch(
        `${this.apiUrl}/2.0/Transaction/GetTransactionStatus`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            pp_SecureHash: secureHash,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json() as {
        pp_ResponseCode?: string;
        pp_ResponseMessage?: string;
        pp_TxnRefNo?: string;
        pp_Amount?: string;
        pp_TxnDateTime?: string;
        pp_MobileNumber?: string;
      };

      const isCompleted = data?.pp_ResponseCode === "000";

      return {
        success: true,
        verified: isCompleted,
        status: isCompleted ? "completed" : "failed",
        gatewayTransactionId: data?.pp_TxnRefNo || request.gatewayTransactionId,
        paidAmount: data?.pp_Amount ? parseInt(data.pp_Amount) / 100 : undefined,
        payerPhone: data?.pp_MobileNumber,
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
    _headers: Record<string, string>,
    _rawBody: string
  ): Promise<WebhookValidationResult> {
    try {
      const data = payload as Record<string, string>;

      // Extract and validate secure hash
      const receivedHash = data.pp_SecureHash;
      const paramsForHash = { ...data };
      delete paramsForHash.pp_SecureHash;

      const expectedHash = this.generateSecureHash(paramsForHash);

      if (receivedHash !== expectedHash) {
        return { isValid: false, error: "Secure hash mismatch" };
      }

      const isCompleted = data.pp_ResponseCode === "000";

      return {
        isValid: true,
        gatewayTransactionId: data.pp_TxnRefNo,
        orderId: data.pp_BillReference,
        status: isCompleted ? "completed" : "failed",
        amount: data.pp_Amount ? parseInt(data.pp_Amount) / 100 : undefined,
      };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : "Webhook validation failed",
      };
    }
  }

  async processRefund(_request: RefundRequest): Promise<RefundResponse> {
    // JazzCash refunds handled via merchant portal
    return {
      success: false,
      status: "failed",
      error: "JazzCash refunds are processed via the JazzCash merchant portal. Please contact support.",
    };
  }

  async getTransactionStatus(
    request: TransactionStatusRequest
  ): Promise<TransactionStatusResponse> {
    try {
      const payload = {
        pp_TxnRefNo: request.gatewayTransactionId || "",
        pp_MerchantID: this.merchantId,
        pp_Password: this.password,
      };

      const response = await fetch(
        `${this.apiUrl}/2.0/Transaction/GetTransactionStatus`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            pp_SecureHash: this.generateSecureHash(payload),
          }),
        }
      );

      if (!response.ok) return { found: false };

      const data = await response.json() as {
        pp_ResponseCode?: string;
        pp_Amount?: string;
      };

      return {
        found: true,
        status: data.pp_ResponseCode === "000" ? "completed" : "pending",
        amount: data.pp_Amount ? parseInt(data.pp_Amount) / 100 : undefined,
      };
    } catch {
      return { found: false };
    }
  }

  private generateSecureHash(params: Record<string, string>): string {
    // JazzCash: sort keys, join with & using only pp_ prefixed params
    const sorted = Object.keys(params)
      .filter((k) => k.startsWith("pp_") && params[k] !== "")
      .sort()
      .map((k) => params[k])
      .join("&");

    const toHash = `${this.integritySalt}&${sorted}`;

    return crypto
      .createHmac("sha256", this.integritySalt)
      .update(toHash)
      .digest("hex");
  }
}