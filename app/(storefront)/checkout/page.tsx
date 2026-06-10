"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Loader2, Lock, CheckCircle2, CreditCard, Wallet, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCartStore } from "@/lib/store/cart-store";
import { formatPrice, calculateTax, calculateShipping } from "@/lib/utils";
import { appConfig } from "@/lib/env";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type GatewayId =
  | "payfast"
  | "safepay"
  | "hblpay"
  | "easypaisa"
  | "jazzcash"
  | "cod";

interface GatewayOption {
  id: GatewayId;
  name: string;
  description: string | null;
  logo: string | null;
  minAmount: number;
  maxAmount: number;
  methods: string[];
}

interface CheckoutResponseData {
  gateway: GatewayId;
  url: string | null;
  formAction: string | null;
  formFields: Record<string, string> | null;
  deepLink: string | null;
  qrCode: string | null;
}

// ─── Gateway icon fallbacks (shown when logo file is missing) ─────────────────

function GatewayIcon({ gateway }: { gateway: GatewayId }) {
  if (gateway === "easypaisa" || gateway === "jazzcash") {
    return <Wallet className="h-5 w-5 text-gold-400" />;
  }
  if (gateway === "cod") {
    return <Truck className="h-5 w-5 text-gold-400" />;
  }
  return <CreditCard className="h-5 w-5 text-gold-400" />;
}

// ─── Static fallback gateway list (used if /api/checkout GET fails) ───────────
// Remove this once your gateway env vars are configured and the API works.

const FALLBACK_GATEWAYS: GatewayOption[] = [
  {
    id: "payfast",
    name: "PayFast",
    description: "Pay with Visa or Mastercard",
    logo: "/icons/payfast.svg",
    minAmount: 10,
    maxAmount: 1_000_000,
    methods: ["credit_card", "debit_card"],
  },
  {
    id: "safepay",
    name: "Safepay",
    description: "Pakistan's secure card gateway",
    logo: "/icons/safepay.svg",
    minAmount: 1,
    maxAmount: 500_000,
    methods: ["credit_card", "debit_card"],
  },
  {
    id: "hblpay",
    name: "HBL Pay",
    description: "Pay with HBL Bank",
    logo: "/icons/hblpay.svg",
    minAmount: 1,
    maxAmount: 2_000_000,
    methods: ["credit_card", "debit_card"],
  },
  {
    id: "easypaisa",
    name: "Easypaisa",
    description: "Pay with your Easypaisa wallet",
    logo: "/icons/easypaisa.svg",
    minAmount: 1,
    maxAmount: 25_000,
    methods: ["easypaisa_wallet"],
  },
  {
    id: "jazzcash",
    name: "JazzCash",
    description: "Pay with your JazzCash account",
    logo: "/icons/jazzcash.svg",
    minAmount: 10,
    maxAmount: 25_000,
    methods: ["jazzcash_wallet"],
  },
  {
    id: "cod",
    name: "Cash on Delivery",
    description: "Pay in cash when your order arrives",
    logo: "/icons/cod.svg",
    minAmount: 0,
    maxAmount: 50_000,
    methods: ["cash_on_delivery"],
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { items, couponCode, couponDiscount, clearCart } = useCartStore();

  const [loading, setLoading] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<GatewayId>("payfast");
  const [gateways, setGateways] = useState<GatewayOption[]>(FALLBACK_GATEWAYS);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: session?.user?.email ?? "",
    phone: "",
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "Pakistan",
    notes: "",
  });

  // ── Sync email once session loads ──────────────────────────────────────────
  useEffect(() => {
    if (session?.user?.email) {
      setForm((prev) => ({ ...prev, email: session.user!.email! }));
    }
  }, [session?.user?.email]);

  // ── Load available gateways from API ──────────────────────────────────────
  useEffect(() => {
    fetch("/api/checkout")
      .then((r) => r.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setGateways(res.data as GatewayOption[]);
        }
      })
      .catch(() => {
        // Silent fail — fallback list is shown
      });
  }, []);

  // ── Totals ─────────────────────────────────────────────────────────────────
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const afterDiscount = Math.max(0, subtotal - couponDiscount);
  const shipping = calculateShipping(
    afterDiscount,
    appConfig.freeShippingThreshold,
    appConfig.shippingFlatRate
  );
  const tax = calculateTax(afterDiscount, appConfig.taxRate);
  const total = afterDiscount + shipping + tax;

  // ── Guards ─────────────────────────────────────────────────────────────────
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <Loader2 className="h-8 w-8 animate-spin text-gold-400" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="pt-20 min-h-[60vh] flex flex-col items-center justify-center container-luxury">
        <h1 className="font-display text-2xl text-ivory-50 mb-4">
          Sign in to checkout
        </h1>
        <Button variant="luxury" asChild>
          <Link href="/login?callbackUrl=/checkout">Sign In</Link>
        </Button>
      </div>
    );
  }

  if (items.length === 0) {
    router.push("/cart");
    return null;
  }

  // ── Check if selected gateway supports the order total ────────────────────
  const activeGateway = gateways.find((g) => g.id === selectedGateway);
  const gatewayAmountError =
    activeGateway && total > activeGateway.maxAmount
      ? `${activeGateway.name} supports a maximum of ${formatPrice(activeGateway.maxAmount)}. Please choose a different payment method.`
      : null;

  // ── Submit handler ─────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (gatewayAmountError) {
      toast.error(gatewayAmountError);
      return;
    }

    setLoading(true);

    try {
      // Step 1 — create the order
      const shippingAddress = {
        label: "Shipping",
        firstName: form.firstName,
        lastName: form.lastName,
        street: form.street,
        city: form.city,
        state: form.state,
        postalCode: form.postalCode,
        country: form.country,
        phone: form.phone,
      };

      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.id, quantity: i.quantity })),
          shippingAddress,
          billingAddress: shippingAddress,
          sameAsBilling: true,
          notes: form.notes,
          couponCode,
        }),
      });

      const orderData = await orderRes.json();

      if (!orderData.success) {
        toast.error(orderData.error || "Failed to create order");
        return;
      }

      // Step 2 — initiate payment with selected gateway
      const checkoutRes = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderData.data.id,
          gateway: selectedGateway,
        }),
      });

      const checkoutData = await checkoutRes.json();

      if (!checkoutData.success) {
        toast.error(checkoutData.error || "Payment setup failed");
        return;
      }

      const data = checkoutData.data as CheckoutResponseData;

      clearCart();

      // COD and hosted-redirect gateways return a plain URL
      if (data.url) {
        window.location.href = data.url;
        return;
      }

      // EasyPaisa / JazzCash return a POST form
      if (data.formAction && data.formFields) {
        const form = document.createElement("form");
        form.method = "POST";
        form.action = data.formAction;

        Object.entries(data.formFields).forEach(([key, value]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = value;
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
        return;
      }
      // 3. Optional deep link support (mobile wallets)
      if (data.deepLink) {
        window.location.href = data.deepLink;
        return;
      }

      // 4. QR fallback (if you ever use JazzCash QR)
      if (data.qrCode) {
        toast.message("Scan QR to complete payment");
        return;
      }
      

      // Fallback — should not happen with a correct gateway implementation
      toast.error("Unexpected response from payment provider. Please try again.");
    } catch {
      toast.error("Checkout failed. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="pt-20 md:pt-24">
      <div className="container-luxury py-8 md:py-12 max-w-4xl">

        {/* Header */}
        <div className="flex items-center gap-2 mb-8">
          <Lock className="h-5 w-5 text-gold-400" />
          <h1 className="font-display text-3xl tracking-widest text-ivory-50 uppercase">
            Secure Checkout
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="grid md:grid-cols-5 gap-10">

          {/* ── Left column — shipping + payment method ── */}
          <div className="md:col-span-3 space-y-6">

            {/* Shipping Details */}
            <div className="luxury-card p-6">
              <h2 className="font-heading text-lg text-gold-400 mb-4">
                Shipping Details
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    required
                    value={form.firstName}
                    onChange={(e) => updateField("firstName", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    required
                    value={form.lastName}
                    onChange={(e) => updateField("lastName", e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="phone">Phone (for delivery updates)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+92 300 0000000"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="street">Street Address</Label>
                  <Input
                    id="street"
                    required
                    value={form.street}
                    onChange={(e) => updateField("street", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    required
                    value={form.city}
                    onChange={(e) => updateField("city", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="state">Province</Label>
                  <Input
                    id="state"
                    required
                    value={form.state}
                    onChange={(e) => updateField("state", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    required
                    value={form.postalCode}
                    onChange={(e) => updateField("postalCode", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    required
                    value={form.country}
                    onChange={(e) => updateField("country", e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="notes">Order Notes (optional)</Label>
                  <Input
                    id="notes"
                    placeholder="Special instructions for delivery…"
                    value={form.notes}
                    onChange={(e) => updateField("notes", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="luxury-card p-6">
              <h2 className="font-heading text-lg text-gold-400 mb-4">
                Payment Method
              </h2>

              <div className="space-y-3">
                {gateways.map((gateway) => {
                  const isSelected = selectedGateway === gateway.id;
                  const isDisabled = total > gateway.maxAmount;

                  return (
                    <label
                      key={gateway.id}
                      className={[
                        "flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all",
                        isDisabled
                          ? "opacity-40 cursor-not-allowed border-obsidian-700"
                          : isSelected
                          ? "border-gold-500 bg-gold-500/5"
                          : "border-obsidian-700 hover:border-obsidian-500",
                      ].join(" ")}
                    >
                      <input
                        type="radio"
                        name="gateway"
                        value={gateway.id}
                        checked={isSelected}
                        disabled={isDisabled}
                        onChange={() => setSelectedGateway(gateway.id)}
                        className="sr-only"
                      />

                      {/* Radio indicator */}
                      <div
                        className={[
                          "w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center",
                          isSelected
                            ? "border-gold-400"
                            : "border-obsidian-500",
                        ].join(" ")}
                      >
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-gold-400" />
                        )}
                      </div>

                      {/* Logo or fallback icon */}
                      <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                        {gateway.logo ? (
                          <Image
                            src={gateway.logo}
                            alt={gateway.name}
                            width={32}
                            height={32}
                            className="object-contain"
                            onError={(e) => {
                              // Hide broken image, show fallback via CSS sibling
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <GatewayIcon gateway={gateway.id} />
                        )}
                      </div>

                      {/* Name + description */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ivory-100">
                          {gateway.name}
                        </p>
                        {gateway.description && (
                          <p className="text-xs text-obsidian-400 mt-0.5">
                            {gateway.description}
                          </p>
                        )}
                        {isDisabled && (
                          <p className="text-xs text-red-400 mt-0.5">
                            Max {formatPrice(gateway.maxAmount)} for this method
                          </p>
                        )}
                      </div>

                      {isSelected && (
                        <CheckCircle2 className="h-4 w-4 text-gold-400 flex-shrink-0" />
                      )}
                    </label>
                  );
                })}
              </div>

              {/* Security note */}
              <p className="text-xs text-obsidian-500 flex items-center gap-2 mt-4">
                <Lock className="h-3 w-3 flex-shrink-0" />
                All transactions are encrypted and processed securely by our
                payment partners. We never store your card details.
              </p>
            </div>
          </div>

          {/* ── Right column — order summary + CTA ── */}
          <div className="md:col-span-2">
            <div className="luxury-card p-6 sticky top-24">
              <h2 className="font-heading text-lg text-gold-400 mb-4">
                Order Summary
              </h2>

              {/* Line items */}
              <div className="space-y-2 mb-4">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-obsidian-300 truncate mr-2">
                      {item.name} × {item.quantity}
                    </span>
                    <span className="text-ivory-100 flex-shrink-0">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-2 text-sm border-t border-obsidian-700 pt-4">
                <div className="flex justify-between">
                  <span className="text-obsidian-400">Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount</span>
                    <span>-{formatPrice(couponDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-obsidian-400">Shipping</span>
                  <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-obsidian-400">Tax</span>
                  <span>{formatPrice(tax)}</span>
                </div>
                <div className="flex justify-between text-lg font-medium pt-2 border-t border-obsidian-700">
                  <span>Total</span>
                  <span className="text-gold-400">{formatPrice(total)}</span>
                </div>
              </div>

              {/* Gateway-specific warning */}
              {gatewayAmountError && (
                <p className="text-xs text-red-400 mt-3 p-3 rounded-md bg-red-500/10 border border-red-500/20">
                  {gatewayAmountError}
                </p>
              )}

              {/* Submit button — label changes by gateway */}
              <Button
                type="submit"
                variant="luxury"
                className="w-full mt-6"
                size="lg"
                disabled={loading || !!gatewayAmountError}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : selectedGateway === "cod" ? (
                  "Place Order"
                ) : (
                  `Pay with ${
                    gateways.find((g) => g.id === selectedGateway)?.name ??
                    "Selected Gateway"
                  }`
                )}
              </Button>

              <p className="text-center text-xs text-obsidian-500 mt-3">
                By placing your order you agree to our{" "}
                <Link href="/terms-of-service" className="underline hover:text-ivory-300">
                  Terms of Service
                </Link>
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}