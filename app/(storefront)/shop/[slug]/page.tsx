import { notFound } from "next/navigation";
import { getProductBySlug, getRelatedProducts } from "@/services/product.service";
import { ProductGallery } from "@/components/products/product-gallery";
import { ProductDetails } from "@/components/products/product-details";
import { ReviewsSection } from "@/components/products/reviews-section";
import { RelatedProducts } from "@/components/products/related-products";
import { absoluteUrl } from "@/lib/utils";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product Not Found" };

  return {
    title: product.name,
    description: product.shortDesc || product.description.slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.shortDesc || undefined,
      images: [{ url: product.thumbnail }],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product.id, product.category.id);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images,
    sku: product.sku,
    brand: { "@type": "Brand", name: "Miraaq" },
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "USD",
      availability:
        (product.inventory?.quantity ?? 0) > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: absoluteUrl(`/shop/${product.slug}`),
    },
    ...(product.averageRating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: product.averageRating,
        reviewCount: product.reviews?.length ?? 0,
      },
    }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="pt-20 md:pt-24">
        <div className="container-luxury py-8 md:py-12">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
            <ProductGallery images={product.images} name={product.name} />
            <ProductDetails product={product} />
          </div>

          <div className="mt-16 border-t border-obsidian-800 pt-16">
            <ReviewsSection
              productId={product.id}
              reviews={
                (product as { reviews?: Array<{ id: string; rating: number; title: string | null; comment: string; createdAt: Date; user: { name: string | null; image: string | null } }> }).reviews ?? []
              }
            />
          </div>

          {related.length > 0 && (
            <div className="mt-16 border-t border-obsidian-800 pt-16">
              <RelatedProducts products={related} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
