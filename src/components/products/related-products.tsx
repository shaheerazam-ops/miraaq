import { ProductCard } from "@/components/products/product-card";
import type { ProductWithDetails } from "@/types";

interface RelatedProductsProps {
  products: ProductWithDetails[];
}

export function RelatedProducts({ products }: RelatedProductsProps) {
  return (
    <div>
      <h2 className="font-display text-2xl tracking-widest text-ivory-50 uppercase mb-8">
        You May Also Like
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product, i) => (
          <ProductCard key={product.id} product={product} index={i} />
        ))}
      </div>
    </div>
  );
}
