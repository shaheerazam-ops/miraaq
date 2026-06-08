// ============================================================
// Payment Gateway Registry
// Central factory and switcher for all payment providers
// Supports runtime switching via environment variables
// ============================================================

import { PayFastGateway } from "../payfast/payfast.gateway";
import { SafepayGateway } from "../safepay/safepay.gateway";
import { HBLPayGateway } from "../hblpay/hblpay.gateway";
import { EasypaisaGateway } from "../easypaisa/easypaisa.gateway";
import { JazzCashGateway } from "../jazzcash/jazzcash.gateway";
import {
  BasePaymentGateway,
  GatewayConfig,
  PaymentGatewayId,
} from "../abstractions/gateway.interface";

// Singleton instances
let payfastInstance: PayFastGateway | null = null;
let safepayInstance: SafepayGateway | null = null;
let hblpayInstance: HBLPayGateway | null = null;
let easypaisaInstance: EasypaisaGateway | null = null;
let jazzcashInstance: JazzCashGateway | null = null;

function getGatewayInstance(id: PaymentGatewayId): BasePaymentGateway {
  switch (id) {
    case "payfast":
      if (!payfastInstance) payfastInstance = new PayFastGateway();
      return payfastInstance;
    case "safepay":
      if (!safepayInstance) safepayInstance = new SafepayGateway();
      return safepayInstance;
    case "hblpay":
      if (!hblpayInstance) hblpayInstance = new HBLPayGateway();
      return hblpayInstance;
    case "easypaisa":
      if (!easypaisaInstance) easypaisaInstance = new EasypaisaGateway();
      return easypaisaInstance;
    case "jazzcash":
      if (!jazzcashInstance) jazzcashInstance = new JazzCashGateway();
      return jazzcashInstance;
    default:
      throw new Error(`Unknown payment gateway: ${id}`);
  }
}

// ============================================================
// GATEWAY REGISTRY
// ============================================================

export class PaymentGatewayRegistry {
  private static primaryGatewayId: PaymentGatewayId =
    (process.env.PAYMENT_PRIMARY_GATEWAY as PaymentGatewayId) || "payfast";

  private static walletEnabled: boolean =
    process.env.PAYMENT_WALLET_ENABLED === "true";

  /**
   * Get the primary card payment gateway
   * Configured via PAYMENT_PRIMARY_GATEWAY env var
   */
  static getPrimaryGateway(): BasePaymentGateway {
    return getGatewayInstance(this.primaryGatewayId);
  }

  /**
   * Get a specific gateway by ID
   */
  static getGateway(id: PaymentGatewayId): BasePaymentGateway {
    return getGatewayInstance(id);
  }

  /**
   * Get Easypaisa wallet gateway
   */
  static getEasypaisaGateway(): EasypaisaGateway {
    return getGatewayInstance("easypaisa") as EasypaisaGateway;
  }

  /**
   * Get JazzCash wallet gateway
   */
  static getJazzCashGateway(): JazzCashGateway {
    return getGatewayInstance("jazzcash") as JazzCashGateway;
  }

  /**
   * Get all active gateways for display on checkout
   */
  static getActiveGateways(): GatewayConfig[] {
    const gateways: GatewayConfig[] = [];

    // Card gateways
    try {
      const primary = getGatewayInstance(this.primaryGatewayId);
      if (primary.isAvailable()) {
        gateways.push(primary.getConfig());
      }
    } catch {
      // Gateway not configured
    }

    // Wallet gateways
    if (this.walletEnabled) {
      try {
        const easypaisa = getGatewayInstance("easypaisa");
        if (easypaisa.isAvailable()) {
          gateways.push(easypaisa.getConfig());
        }
      } catch {
        // Not configured
      }

      try {
        const jazzcash = getGatewayInstance("jazzcash");
        if (jazzcash.isAvailable()) {
          gateways.push(jazzcash.getConfig());
        }
      } catch {
        // Not configured
      }
    }

    return gateways;
  }

  /**
   * Get gateway from webhook header identifier
   */
  static getGatewayFromIdentifier(identifier: string): BasePaymentGateway | null {
    const map: Record<string, PaymentGatewayId> = {
      payfast: "payfast",
      "x-payfast": "payfast",
      safepay: "safepay",
      "x-sfpy": "safepay",
      hblpay: "hblpay",
      "x-hbl": "hblpay",
      easypaisa: "easypaisa",
      jazzcash: "jazzcash",
    };

    const gatewayId = map[identifier.toLowerCase()];
    if (!gatewayId) return null;

    try {
      return getGatewayInstance(gatewayId);
    } catch {
      return null;
    }
  }

  /**
   * Check if a specific gateway is available
   */
  static isGatewayAvailable(id: PaymentGatewayId): boolean {
    try {
      const gateway = getGatewayInstance(id);
      return gateway.isAvailable();
    } catch {
      return false;
    }
  }

  /**
   * Get all gateway IDs that are currently active
   */
  static getActiveGatewayIds(): PaymentGatewayId[] {
    const allIds: PaymentGatewayId[] = [
      "payfast",
      "safepay",
      "hblpay",
      "easypaisa",
      "jazzcash",
    ];

    return allIds.filter((id) => this.isGatewayAvailable(id));
  }
}

// Convenience exports
export const getPaymentGateway = (id: PaymentGatewayId) =>
  PaymentGatewayRegistry.getGateway(id);

export const getPrimaryGateway = () =>
  PaymentGatewayRegistry.getPrimaryGateway();

export const getActiveGateways = () =>
  PaymentGatewayRegistry.getActiveGateways();