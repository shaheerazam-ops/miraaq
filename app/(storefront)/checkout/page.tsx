"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCartStore } from "@/lib/store/cart-store";
import { formatPrice, calculateTax, calculateShipping } from "@/lib/utils";
import { appConfig } from "@/lib/env";
import { toast } from "sonner";

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { items, couponCode, couponDiscount, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: session?.user?.email ?? "",
    phone: "",
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "US",
    notes: "",
  });

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const afterDiscount = Math.max(0, subtotal - couponDiscount);
  const shipping = calculateShipping(afterDiscount, appConfig.freeShippingThreshold, appConfig.shippingFlatRate);
  const tax = calculateTax(afterDiscount, appConfig.taxRate);
  const total = afterDiscount + shipping + tax;

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
        <h1 className="font-display text-2xl text-ivory-50 mb-4">Sign in to checkout</h1>
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
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

      const checkoutRes = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: orderData.data.id }),
      });
      const checkoutData = await checkoutRes.json();
      if (checkoutData.success && checkoutData.data.url) {
        clearCart();
        window.location.href = checkoutData.data.url;
      } else {
        toast.error(checkoutData.error || "Payment setup failed");
      }
    } catch {
      toast.error("Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="pt-20 md:pt-24">
      <div className="container-luxury py-8 md:py-12 max-w-4xl">
        <div className="flex items-center gap-2 mb-8">
          <Lock className="h-5 w-5 text-gold-400" />
          <h1 className="font-display text-3xl tracking-widest text-ivory-50 uppercase">
            Secure Checkout
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="grid md:grid-cols-5 gap-10">
          <div className="md:col-span-3 space-y-6">
            <div className="luxury-card p-6">
              <h2 className="font-heading text-lg text-gold-400 mb-4">Shipping Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" required value={form.firstName} onChange={(e) => updateField("firstName", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" required value={form.lastName} onChange={(e) => updateField("lastName", e.target.value)} />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required value={form.email} onChange={(e) => updateField("email", e.target.value)} />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="street">Street Address</Label>
                  <Input id="street" required value={form.street} onChange={(e) => updateField("street", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input id="city" required value={form.city} onChange={(e) => updateField("city", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input id="state" required value={form.state} onChange={(e) => updateField("state", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input id="postalCode" required value={form.postalCode} onChange={(e) => updateField("postalCode", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input id="country" required value={form.country} onChange={(e) => updateField("country", e.target.value)} />
                </div>
              </div>
            </div>

            <p className="text-xs text-obsidian-500 flex items-center gap-2">
              <Lock className="h-3 w-3" />
              Secured by Stripe · Visa, Mastercard, Apple Pay, Google Pay accepted
            </p>
          </div>

          <div className="md:col-span-2">
            <div className="luxury-card p-6 sticky top-24">
              <h2 className="font-heading text-lg text-gold-400 mb-4">Order Summary</h2>
              <div className="space-y-2 mb-4">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-obsidian-300 truncate mr-2">{item.name} × {item.quantity}</span>
                    <span>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2 text-sm border-t border-obsidian-700 pt-4">
                <div className="flex justify-between"><span className="text-obsidian-400">Subtotal</span><span>{formatPrice(subtotal)}</span></div>
                {couponDiscount > 0 && <div className="flex justify-between text-emerald-400"><span>Discount</span><span>-{formatPrice(couponDiscount)}</span></div>}
                <div className="flex justify-between"><span className="text-obsidian-400">Shipping</span><span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span></div>
                <div className="flex justify-between"><span className="text-obsidian-400">Tax</span><span>{formatPrice(tax)}</span></div>
                <div className="flex justify-between text-lg font-medium pt-2 border-t border-obsidian-700">
                  <span>Total</span><span className="text-gold-400">{formatPrice(total)}</span>
                </div>
              </div>
              <Button type="submit" variant="luxury" className="w-full mt-6" size="lg" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Pay with Stripe"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
