"use client";

import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, Trash2, Tag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCartStore } from "@/lib/store/cart-store";
import { formatPrice, calculateTax, calculateShipping } from "@/lib/utils";
import { appConfig } from "@/lib/env";
import { useState } from "react";
import { toast } from "sonner";

export default function CartPage() {
  const { items, updateQuantity, removeItem, couponCode, couponDiscount, setCoupon } =
    useCartStore();
  const [couponInput, setCouponInput] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const discount = couponDiscount;
  const afterDiscount = Math.max(0, subtotal - discount);
  const shipping = calculateShipping(
    afterDiscount,
    appConfig.freeShippingThreshold,
    appConfig.shippingFlatRate
  );
  const tax = calculateTax(afterDiscount, appConfig.taxRate);
  const total = afterDiscount + shipping + tax;

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setApplyingCoupon(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponInput, subtotal }),
      });
      const data = await res.json();
      if (data.success && data.data.valid) {
        setCoupon(couponInput.toUpperCase(), data.data.discount);
        toast.success(data.data.message);
      } else {
        toast.error(data.data?.message || data.error || "Invalid coupon");
      }
    } catch {
      toast.error("Failed to apply coupon");
    } finally {
      setApplyingCoupon(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="pt-20 md:pt-24 min-h-[60vh] flex flex-col items-center justify-center container-luxury">
        <h1 className="font-display text-3xl tracking-widest text-ivory-50 uppercase mb-4">Your Cart</h1>
        <p className="text-obsidian-400 mb-8">Your cart is empty</p>
        <Button variant="luxury" asChild>
          <Link href="/shop">Continue Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="pt-20 md:pt-24">
      <div className="container-luxury py-8 md:py-12">
        <h1 className="font-display text-3xl md:text-4xl tracking-widest text-ivory-50 uppercase mb-8">
          Your Cart
        </h1>

        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="luxury-card p-4 flex gap-4">
                <div className="relative w-24 h-24 rounded overflow-hidden flex-shrink-0">
                  <Image src={item.thumbnail} alt={item.name} fill className="object-cover" sizes="96px" />
                </div>
                <div className="flex-1">
                  <Link href={`/shop/${item.slug}`} className="font-heading text-lg text-ivory-100 hover:text-gold-400">
                    {item.name}
                  </Link>
                  <p className="text-xs text-obsidian-400 mt-1">{item.volume}</p>
                  <p className="text-gold-400 mt-2">{formatPrice(item.price)}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center border border-obsidian-700 rounded">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-2 py-1 hover:bg-obsidian-800">
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="px-3 text-sm">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-2 py-1 hover:bg-obsidian-800">
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="text-obsidian-500 hover:text-red-400 ml-auto">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gold-400 font-medium">{formatPrice(item.price * item.quantity)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="luxury-card p-6 h-fit sticky top-24">
            <h2 className="font-heading text-xl text-gold-400 mb-6">Order Summary</h2>

            <div className="flex gap-2 mb-6">
              <Input
                placeholder="Coupon code"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                className="flex-1"
              />
              <Button variant="outline" onClick={handleApplyCoupon} disabled={applyingCoupon}>
                <Tag className="h-4 w-4" />
              </Button>
            </div>
            {couponCode && (
              <p className="text-xs text-emerald-400 mb-4">Coupon {couponCode} applied</p>
            )}

            <div className="space-y-3 text-sm border-t border-obsidian-700 pt-4">
              <div className="flex justify-between">
                <span className="text-obsidian-400">Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount</span>
                  <span>-{formatPrice(discount)}</span>
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
              <div className="flex justify-between text-lg font-medium border-t border-obsidian-700 pt-3">
                <span className="text-ivory-100">Total</span>
                <span className="text-gold-400">{formatPrice(total)}</span>
              </div>
            </div>

            <Button variant="luxury" className="w-full mt-6" size="lg" asChild>
              <Link href="/checkout">
                Proceed to Checkout
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>

            <Link href="/shop" className="block text-center text-sm text-obsidian-400 hover:text-gold-400 mt-4">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
