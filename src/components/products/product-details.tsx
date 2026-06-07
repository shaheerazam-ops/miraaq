"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, ShoppingBag, Minus, Plus, Star, Truck, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCartStore, useWishlistStore } from "@/lib/store/cart-store";
import { formatPrice, cn } from "@/lib/utils";
import type { ProductWithDetails } from "@/types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ProductDetailsProps {
  product: ProductWithDetails;
}

export function ProductDetails({ product }: ProductDetailsProps) {
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((s) => s.addItem);
  const { toggleItem, isInWishlist } = useWishlistStore();
  const inWishlist = isInWishlist(product.id);
  const router = useRouter();
  const outOfStock = (product.inventory?.quantity ?? 0) <= 0;
  const maxQty = product.inventory?.quantity ?? 99;

  const handleAddToCart = () => {
    if (outOfStock) return;
    for (let i = 0; i < quantity; i++) addItem(product);
    toast.success(`Added ${quantity} to cart`);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push("/checkout");
  };

  const noteGroups = [
    { label: "Top Notes", notes: product.topNotes, color: "text-emerald-400" },
    { label: "Heart Notes", notes: product.heartNotes, color: "text-gold-400" },
    { label: "Base Notes", notes: product.baseNotes, color: "text-amber-600" },
  ];

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Link href={`/shop?category=${product.category.slug}`} className="text-xs text-obsidian-400 hover:text-gold-400 uppercase tracking-wider">
          {product.category.name}
        </Link>
        {product.newArrival && <Badge variant="emerald">New</Badge>}
        {product.bestSeller && <Badge>Best Seller</Badge>}
      </div>

      <h1 className="font-display text-3xl md:text-4xl tracking-wide text-ivory-50 mb-2">
        {product.name}
      </h1>

      {product.averageRating && product.averageRating > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <div className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-4 w-4",
                  i < Math.round(product.averageRating!)
                    ? "fill-gold-400 text-gold-400"
                    : "text-obsidian-600"
                )}
              />
            ))}
          </div>
          <span className="text-sm text-obsidian-400">{product.averageRating}</span>
        </div>
      )}

      <div className="flex items-baseline gap-3 mb-6">
        <span className="text-2xl text-gold-400 font-medium">{formatPrice(product.price)}</span>
        {product.comparePrice && (
          <span className="text-lg text-obsidian-500 line-through">{formatPrice(product.comparePrice)}</span>
        )}
        <span className="text-sm text-obsidian-400">{product.volume}</span>
      </div>

      <p className="text-obsidian-300 leading-relaxed mb-6">{product.shortDesc || product.description.slice(0, 200)}</p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {noteGroups.map((group) => (
          <div key={group.label} className="luxury-card p-4">
            <p className={cn("text-xs uppercase tracking-wider mb-2", group.color)}>{group.label}</p>
            <p className="text-sm text-ivory-200">{group.notes.join(", ")}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <Badge variant="secondary">{product.gender}</Badge>
        <Badge variant="outline">{product.fragranceFamily}</Badge>
        <Badge variant="secondary">{product.volume}</Badge>
      </div>

      {!outOfStock && (
        <div className="flex items-center gap-3 mb-6">
          <span className="text-sm text-obsidian-400">Quantity:</span>
          <div className="flex items-center border border-obsidian-700 rounded-md">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="px-3 py-2 hover:bg-obsidian-800 transition-colors"
              aria-label="Decrease"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="px-4 py-2 text-sm min-w-[3rem] text-center">{quantity}</span>
            <button
              onClick={() => setQuantity(Math.min(maxQty, quantity + 1))}
              className="px-3 py-2 hover:bg-obsidian-800 transition-colors"
              aria-label="Increase"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <span className="text-xs text-obsidian-500">{maxQty} available</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <Button variant="luxury" size="lg" className="flex-1" onClick={handleAddToCart} disabled={outOfStock}>
          <ShoppingBag className="h-4 w-4 mr-2" />
          {outOfStock ? "Out of Stock" : "Add to Cart"}
        </Button>
        <Button variant="outline" size="lg" className="flex-1" onClick={handleBuyNow} disabled={outOfStock}>
          Buy Now
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-12 w-12"
          onClick={() => {
            toggleItem(product.id);
            toast.success(inWishlist ? "Removed from wishlist" : "Added to wishlist");
          }}
        >
          <Heart className={cn("h-5 w-5", inWishlist && "fill-gold-400 text-gold-400")} />
        </Button>
      </div>

      <div className="space-y-3 border-t border-obsidian-800 pt-6">
        <div className="flex items-center gap-3 text-sm text-obsidian-400">
          <Truck className="h-4 w-4 text-gold-500" />
          Free shipping on orders over $150
        </div>
        <div className="flex items-center gap-3 text-sm text-obsidian-400">
          <Shield className="h-4 w-4 text-gold-500" />
          100% authentic · 30-day returns
        </div>
      </div>

      <div className="mt-8 border-t border-obsidian-800 pt-6">
        <h3 className="font-heading text-lg text-gold-400 mb-3">About This Fragrance</h3>
        <p className="text-obsidian-300 leading-relaxed text-sm">{product.description}</p>
      </div>
    </div>
  );
}
