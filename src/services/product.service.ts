import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { ShopFilters, ProductWithDetails } from "@/types";

function serializeProduct(product: Record<string, unknown>): ProductWithDetails {
  const reviews = (product.reviews as { rating: number; approved: boolean }[]) ?? [];
  const approvedRatings = reviews.filter((r) => r.approved).map((r) => r.rating);
  const averageRating =
    approvedRatings.length > 0
      ? Math.round((approvedRatings.reduce((a, b) => a + b, 0) / approvedRatings.length) * 10) / 10
      : 0;

  return {
    ...(product as unknown as ProductWithDetails),
    price: Number(product.price),
    comparePrice: product.comparePrice ? Number(product.comparePrice) : null,
    averageRating,
  };
}

export async function getProducts(filters: ShopFilters = {}) {
  const {
    search,
    category,
    gender,
    fragranceFamily,
    volume,
    minPrice,
    maxPrice,
    sort = "newest",
    page = 1,
    limit = 12,
    featured,
    bestSeller,
    newArrival,
    comboOffer,
  } = filters;

  const where: Prisma.ProductWhereInput = { active: true };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { topNotes: { has: search } },
    ];
  }
  if (category) where.category = { slug: category };
  if (gender) where.gender = gender as Prisma.EnumGenderFilter["equals"];
  if (fragranceFamily)
    where.fragranceFamily = fragranceFamily as Prisma.EnumFragranceFamilyFilter["equals"];
  if (volume) where.volume = volume;
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) where.price.gte = minPrice;
    if (maxPrice !== undefined) where.price.lte = maxPrice;
  }
  if (featured) where.featured = true;
  if (bestSeller) where.bestSeller = true;
  if (newArrival) where.newArrival = true;
  if (comboOffer) where.comboOffer = true;

  const orderBy: Prisma.ProductOrderByWithRelationInput = (() => {
    switch (sort) {
      case "price-asc":
        return { price: "asc" };
      case "price-desc":
        return { price: "desc" };
      case "name-asc":
        return { name: "asc" };
      case "name-desc":
        return { name: "desc" };
      default:
        return { createdAt: "desc" };
    }
  })();

  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        inventory: { select: { quantity: true } },
        reviews: { select: { rating: true, approved: true } },
        _count: { select: { reviews: true } },
      },
    }),
    db.product.count({ where }),
  ]);

  return {
    products: products.map((p) => serializeProduct(p as unknown as Record<string, unknown>)),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getProductBySlug(slug: string) {
  const product = await db.product.findUnique({
    where: { slug, active: true },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      inventory: { select: { quantity: true } },
      reviews: {
        where: { approved: true },
        include: {
          user: { select: { name: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!product) return null;
  return serializeProduct(product as unknown as Record<string, unknown>);
}

export async function getRelatedProducts(productId: string, categoryId: string, limit = 4) {
  const products = await db.product.findMany({
    where: {
      categoryId,
      active: true,
      NOT: { id: productId },
    },
    take: limit,
    include: {
      category: { select: { id: true, name: true, slug: true } },
      inventory: { select: { quantity: true } },
      reviews: { select: { rating: true, approved: true } },
    },
  });
  return products.map((p) => serializeProduct(p as unknown as Record<string, unknown>));
}

export async function getFeaturedProducts(limit = 8) {
  return getProducts({ featured: true, limit, page: 1 });
}

export async function getBestSellers(limit = 8) {
  return getProducts({ bestSeller: true, limit, page: 1 });
}

export async function getNewArrivals(limit = 8) {
  return getProducts({ newArrival: true, limit, page: 1 });
}

export async function getComboOffers(limit = 4) {
  return getProducts({ comboOffer: true, limit, page: 1 });
}

export async function getCategories() {
  return db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { products: true } },
    },
  });
}

export async function validateCoupon(code: string, subtotal: number) {
  const coupon = await db.coupon.findFirst({
    where: {
      code: code.toUpperCase(),
      active: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  });

  if (!coupon) return { valid: false, discount: 0, message: "Invalid coupon code" };
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses)
    return { valid: false, discount: 0, message: "Coupon has reached maximum uses" };
  if (coupon.minPurchase && subtotal < Number(coupon.minPurchase))
    return {
      valid: false,
      discount: 0,
      message: `Minimum purchase of $${coupon.minPurchase} required`,
    };

  const discount =
    coupon.type === "PERCENTAGE"
      ? Math.round(subtotal * (Number(coupon.value) / 100) * 100) / 100
      : Math.min(Number(coupon.value), subtotal);

  return { valid: true, discount, couponId: coupon.id, message: "Coupon applied" };
}

export async function getAdminAnalytics() {
  const [totalOrders, totalCustomers, totalProducts, revenueData, ordersByStatus, topProducts] =
    await Promise.all([
      db.order.count(),
      db.user.count({ where: { role: "USER" } }),
      db.product.count({ where: { active: true } }),
      db.order.aggregate({
        where: { status: { notIn: ["CANCELLED", "REFUNDED"] } },
        _sum: { total: true },
      }),
      db.order.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
      db.orderItem.groupBy({
        by: ["productId", "name"],
        _sum: { quantity: true, price: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
    ]);

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlyOrders = await db.order.findMany({
    where: {
      createdAt: { gte: sixMonthsAgo },
      status: { notIn: ["CANCELLED", "REFUNDED"] },
    },
    select: { total: true, createdAt: true },
  });

  const revenueByMonth: Record<string, number> = {};
  monthlyOrders.forEach((order) => {
    const month = order.createdAt.toLocaleString("en-US", { month: "short", year: "2-digit" });
    revenueByMonth[month] = (revenueByMonth[month] ?? 0) + Number(order.total);
  });

  return {
    totalRevenue: Number(revenueData._sum.total ?? 0),
    totalOrders,
    totalCustomers,
    totalProducts,
    revenueByMonth: Object.entries(revenueByMonth).map(([month, revenue]) => ({
      month,
      revenue,
    })),
    ordersByStatus: ordersByStatus.map((o) => ({
      status: o.status,
      count: o._count.status,
    })),
    topProducts: topProducts.map((p) => ({
      name: p.name,
      sales: p._sum.quantity ?? 0,
      revenue: Number(p._sum.price ?? 0),
    })),
  };
}
