// ============================================================
// MIRAAQ - Payment Gateway Abstraction Layer
// All payment gateways implement this interface
// ============================================================

export type PaymentGatewayId =
  | "payfast"
  | "safepay"
  | "hblpay"
  | "easypaisa"
  | "jazzcash";

export type PaymentCurrency = "PKR" | "USD" | "AED";

export interface PaymentAmount {
  amount: number;       // In smallest currency unit (paisa for PKR)
  currency: PaymentCurrency;
  formatted: string;    // Human readable: "₨1,000.00"
}

export interface PayerInfo {
  name: string;
  email: string;
  phone?: string;
}

export interface PaymentInitRequest {
  orderId: string;
  orderNumber: string;
  amount: number;        // In PKR (major units)
  currency: PaymentCurrency;
  payer: PayerInfo;
  description: string;
  successUrl: string;
  failureUrl: string;
  cancelUrl: string;
  webhookUrl: string;
  metadata?: Record<string, string>;
}

export interface PaymentInitResponse {
  success: boolean;
  gatewayTransactionId?: string;
  gatewayOrderId?: string;
  redirectUrl?: string;      // For redirect-based flows
  formFields?: Record<string, string>; // For POST-redirect flows
  formAction?: string;       // URL to POST to
  qrCode?: string;           // For wallet payments
  deepLink?: string;         // For wallet app deeplink
  error?: string;
  errorCode?: string;
}

export interface PaymentVerifyRequest {
  gatewayTransactionId: string;
  gatewayOrderId?: string;
  orderId: string;
  amount: number;
  webhookPayload?: Record<string, unknown>;
}

export interface PaymentVerifyResponse {
  success: boolean;
  verified: boolean;
  status: "completed" | "pending" | "failed" | "cancelled";
  gatewayTransactionId?: string;
  gatewayReference?: string;
  paidAmount?: number;
  paidAt?: Date;
  gatewayFee?: number;
  netAmount?: number;
  maskedCard?: string;
  cardBrand?: string;
  payerName?: string;
  payerEmail?: string;
  payerPhone?: string;
  rawResponse?: Record<string, unknown>;
  error?: string;
  errorCode?: string;
}

export interface RefundRequest {
  gatewayTransactionId: string;
  orderId: string;
  refundAmount: number;
  reason: string;
  isPartial: boolean;
}

export interface RefundResponse {
  success: boolean;
  refundId?: string;
  refundedAmount?: number;
  status: "processing" | "completed" | "failed";
  processedAt?: Date;
  error?: string;
}

export interface WebhookValidationResult {
  isValid: boolean;
  gatewayTransactionId?: string;
  orderId?: string;
  status?: string;
  amount?: number;
  error?: string;
}

export interface TransactionStatusRequest {
  gatewayTransactionId?: string;
  orderId?: string;
}

export interface TransactionStatusResponse {
  found: boolean;
  status?: "completed" | "pending" | "failed" | "cancelled" | "refunded";
  amount?: number;
  paidAt?: Date;
  error?: string;
}

export interface GatewayConfig {
  gatewayId: PaymentGatewayId;
  displayName: string;
  supportedMethods: string[];
  supportedCurrencies: PaymentCurrency[];
  minAmount: number;   // In PKR
  maxAmount: number;   // In PKR
  isActive: boolean;
  isLive: boolean;
  logo?: string;
  description?: string;
}

// ============================================================
// ABSTRACT BASE CLASS
// ============================================================

export abstract class BasePaymentGateway {
  protected config: GatewayConfig;

  constructor(config: GatewayConfig) {
    this.config = config;
  }

  getConfig(): GatewayConfig {
    return this.config;
  }

  isAvailable(): boolean {
    return this.config.isActive;
  }

  supportsAmount(amount: number): boolean {
    return amount >= this.config.minAmount && amount <= this.config.maxAmount;
  }

  supportsCurrency(currency: PaymentCurrency): boolean {
    return this.config.supportedCurrencies.includes(currency);
  }

  // Abstract methods all gateways must implement
  abstract initializePayment(
    request: PaymentInitRequest
  ): Promise<PaymentInitResponse>;

  abstract verifyPayment(
    request: PaymentVerifyRequest
  ): Promise<PaymentVerifyResponse>;

  abstract validateWebhook(
    payload: Record<string, unknown>,
    headers: Record<string, string>,
    rawBody: string
  ): Promise<WebhookValidationResult>;

  abstract processRefund(request: RefundRequest): Promise<RefundResponse>;

  abstract getTransactionStatus(
    request: TransactionStatusRequest
  ): Promise<TransactionStatusResponse>;

  // Helper for logging (strips sensitive data)
  protected sanitizeForLog(data: Record<string, unknown>): Record<string, unknown> {
    const sensitiveKeys = [
      "password",
      "secret",
      "key",
      "token",
      "card",
      "cvv",
      "pin",
      "hash",
      "signature",
    ];

    return Object.fromEntries(
      Object.entries(data).map(([k, v]) => [
        k,
        sensitiveKeys.some((s) => k.toLowerCase().includes(s))
          ? "[REDACTED]"
          : v,
      ])
    );
  }

  // Format amount for gateway (some need cents/paisa, some need major units)
  protected formatAmount(amount: number, inPaisa = false): number {
    return inPaisa ? Math.round(amount * 100) : Math.round(amount * 100) / 100;
  }

  // Generate idempotency key
  protected generateIdempotencyKey(orderId: string): string {
    return `${this.config.gatewayId}-${orderId}-${Date.now()}`;
  }
}