import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const productImages = {
  oud:
    "https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&q=80",
  amber:
    "https://images.unsplash.com/photo-1594035910387-825c468a785f?w=800&q=80",
  floral:
    "https://images.unsplash.com/photo-1595425970387-0ce577a8d7c2?w=800&q=80",
  gift:
    "https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=800&q=80",
};

async function main() {
  console.log("🌱 Seeding Miraaq database...");

  const adminPassword = await bcrypt.hash("Admin@123456", 12);
  const userPassword = await bcrypt.hash("User@123456", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@miraaq.com" },
    update: {},
    create: {
      email: "admin@miraaq.com",
      name: "Miraaq Admin",
      password: adminPassword,
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });

  const user = await prisma.user.upsert({
    where: { email: "customer@miraaq.com" },
    update: {},
    create: {
      email: "customer@miraaq.com",
      name: "Sarah Al-Rashid",
      password: userPassword,
      role: "USER",
      emailVerified: new Date(),
      phone: "+971501234567",
    },
  });

  console.log(`✅ Users: admin=${admin.email}, customer=${user.email}`);

  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: "oud-collection" },
      update: {},
      create: {
        name: "Oud Collection",
        slug: "oud-collection",
        description: "Rare and precious oud fragrances from the finest sources",
        image: productImages.oud,
        featured: true,
        sortOrder: 1,
      },
    }),
    prisma.category.upsert({
      where: { slug: "amber-collection" },
      update: {},
      create: {
        name: "Amber Collection",
        slug: "amber-collection",
        description: "Warm amber and resinous compositions",
        image: productImages.amber,
        featured: true,
        sortOrder: 2,
      },
    }),
    prisma.category.upsert({
      where: { slug: "floral-collection" },
      update: {},
      create: {
        name: "Floral Collection",
        slug: "floral-collection",
        description: "Exquisite floral oriental blends",
        image: productImages.floral,
        featured: true,
        sortOrder: 3,
      },
    }),
    prisma.category.upsert({
      where: { slug: "gift-sets" },
      update: {},
      create: {
        name: "Gift Sets",
        slug: "gift-sets",
        description: "Curated luxury gift collections",
        image: productImages.gift,
        featured: false,
        sortOrder: 4,
      },
    }),
  ]);

  const [oudCat, amberCat, floralCat, giftCat] = categories;

  const products = [
    {
      name: "Royal Cambodian Oud",
      slug: "royal-cambodian-oud",
      description:
        "An opulent oud composition featuring the finest Cambodian oud oil, aged for seven years. Rich, smoky, and infinitely complex with layers of amber, saffron, and rose de mai unfolding over hours.",
      shortDesc: "Seven-year aged Cambodian oud masterpiece",
      price: 385,
      comparePrice: 450,
      sku: "AO-RCO-100",
      volume: "100ml",
      gender: "UNISEX" as const,
      fragranceFamily: "OUD" as const,
      topNotes: ["Saffron", "Cardamom", "Pink Pepper"],
      heartNotes: ["Cambodian Oud", "Rose de Mai", "Jasmine"],
      baseNotes: ["Amber", "Musk", "Sandalwood"],
      images: [productImages.oud, productImages.amber],
      thumbnail: productImages.oud,
      featured: true,
      bestSeller: true,
      newArrival: false,
      comboOffer: false,
      categoryId: oudCat.id,
      quantity: 50,
    },
    {
      name: "Amber Nocturne",
      slug: "amber-nocturne",
      description:
        "A seductive amber oriental that captures the mystery of Arabian nights. Labdanum, benzoin, and vanilla create a warm embrace, while oud and patchouli add depth and intrigue.",
      shortDesc: "Mysterious amber oriental for evening wear",
      price: 245,
      comparePrice: null,
      sku: "AO-AN-75",
      volume: "75ml",
      gender: "UNISEX" as const,
      fragranceFamily: "AMBER" as const,
      topNotes: ["Bergamot", "Pink Pepper", "Saffron"],
      heartNotes: ["Labdanum", "Rose", "Oud"],
      baseNotes: ["Amber", "Vanilla", "Patchouli"],
      images: [productImages.amber],
      thumbnail: productImages.amber,
      featured: true,
      bestSeller: true,
      newArrival: false,
      comboOffer: false,
      categoryId: amberCat.id,
      quantity: 75,
    },
    {
      name: "Damascus Rose",
      slug: "damascus-rose",
      description:
        "The legendary Damascus rose meets precious oud in this floral oriental masterpiece. Hand-picked rose petals from Syria blend with Taif rose and a whisper of oud.",
      shortDesc: "Legendary Damascus rose meets precious oud",
      price: 295,
      comparePrice: 340,
      sku: "AO-DR-75",
      volume: "75ml",
      gender: "WOMEN" as const,
      fragranceFamily: "FLORAL" as const,
      topNotes: ["Damascus Rose", "Lychee", "Peony"],
      heartNotes: ["Taif Rose", "Oud", "Iris"],
      baseNotes: ["Musk", "Amber", "Sandalwood"],
      images: [productImages.floral],
      thumbnail: productImages.floral,
      featured: true,
      bestSeller: false,
      newArrival: true,
      comboOffer: false,
      categoryId: floralCat.id,
      quantity: 60,
    },
    {
      name: "Sultan's Reserve",
      slug: "sultans-reserve",
      description:
        "Our most exclusive creation. Aged Indian oud, rare agarwood, and the finest Mysore sandalwood create an fragrance of unparalleled luxury reserved for true connoisseurs.",
      shortDesc: "Our most exclusive aged oud reserve",
      price: 650,
      comparePrice: null,
      sku: "AO-SR-100",
      volume: "100ml",
      gender: "MEN" as const,
      fragranceFamily: "OUD" as const,
      topNotes: ["Saffron", "Nutmeg", "Cinnamon"],
      heartNotes: ["Indian Oud", "Agarwood", "Leather"],
      baseNotes: ["Mysore Sandalwood", "Amber", "Musk"],
      images: [productImages.oud, productImages.amber],
      thumbnail: productImages.oud,
      featured: true,
      bestSeller: false,
      newArrival: true,
      comboOffer: false,
      categoryId: oudCat.id,
      quantity: 25,
    },
    {
      name: "Desert Mirage",
      slug: "desert-mirage",
      description:
        "Fresh yet opulent, Desert Mirage captures the essence of an oasis at dawn. Citrus top notes give way to a heart of white flowers and a base of warm amber and musk.",
      shortDesc: "Fresh oriental capturing dawn in the desert",
      price: 195,
      comparePrice: null,
      sku: "AO-DM-50",
      volume: "50ml",
      gender: "UNISEX" as const,
      fragranceFamily: "FRESH" as const,
      topNotes: ["Bergamot", "Mandarin", "Neroli"],
      heartNotes: ["Orange Blossom", "Jasmine", "Tuberose"],
      baseNotes: ["Amber", "White Musk", "Cedarwood"],
      images: [productImages.floral, productImages.amber],
      thumbnail: productImages.floral,
      featured: false,
      bestSeller: true,
      newArrival: false,
      comboOffer: false,
      categoryId: floralCat.id,
      quantity: 100,
    },
    {
      name: "Oud & Amber Discovery Set",
      slug: "oud-amber-discovery-set",
      description:
        "A curated collection of four 15ml travel sizes featuring our most beloved oud and amber creations. The perfect introduction to the world of Miraaq.",
      shortDesc: "Four 15ml travel sizes of our finest creations",
      price: 175,
      comparePrice: 220,
      sku: "AO-OADS-4X15",
      volume: "4 x 15ml",
      gender: "UNISEX" as const,
      fragranceFamily: "OUD" as const,
      topNotes: ["Various"],
      heartNotes: ["Various"],
      baseNotes: ["Various"],
      images: [productImages.gift],
      thumbnail: productImages.gift,
      featured: false,
      bestSeller: false,
      newArrival: false,
      comboOffer: true,
      categoryId: giftCat.id,
      quantity: 40,
    },
    {
      name: "Emerald Oud",
      slug: "emerald-oud",
      description:
        "A modern interpretation of oud featuring green notes of galbanum and vetiver alongside traditional oud and amber. Fresh yet deeply oriental.",
      shortDesc: "Modern green oud with vetiver and galbanum",
      price: 265,
      comparePrice: null,
      sku: "AO-EO-75",
      volume: "75ml",
      gender: "MEN" as const,
      fragranceFamily: "WOODY" as const,
      topNotes: ["Galbanum", "Bergamot", "Ginger"],
      heartNotes: ["Oud", "Vetiver", "Cedarwood"],
      baseNotes: ["Amber", "Musk", "Patchouli"],
      images: [productImages.oud],
      thumbnail: productImages.oud,
      featured: false,
      bestSeller: false,
      newArrival: true,
      comboOffer: false,
      categoryId: oudCat.id,
      quantity: 55,
    },
    {
      name: "Golden Musk",
      slug: "golden-musk",
      description:
        "Pure luxury in a bottle. White musk, golden amber, and a touch of oud create a skin scent of extraordinary elegance and longevity.",
      shortDesc: "Elegant white musk with golden amber",
      price: 215,
      comparePrice: null,
      sku: "AO-GM-50",
      volume: "50ml",
      gender: "WOMEN" as const,
      fragranceFamily: "MUSK" as const,
      topNotes: ["Aldehydes", "Bergamot", "Pear"],
      heartNotes: ["White Musk", "Jasmine", "Ylang-Ylang"],
      baseNotes: ["Golden Amber", "Oud", "Sandalwood"],
      images: [productImages.amber],
      thumbnail: productImages.amber,
      featured: false,
      bestSeller: true,
      newArrival: false,
      comboOffer: false,
      categoryId: amberCat.id,
      quantity: 80,
    },
  ];

  for (const p of products) {
    const { quantity, ...productData } = p;
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        ...productData,
        inventory: { create: { quantity, lowStockThreshold: 10 } },
      },
    });
  }

  console.log(`✅ Products: ${products.length} fragrances seeded`);

  await prisma.coupon.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: {
      code: "WELCOME10",
      type: "PERCENTAGE",
      value: 10,
      minPurchase: 100,
      maxUses: 1000,
      active: true,
      expiresAt: new Date("2027-12-31"),
    },
  });

  await prisma.coupon.upsert({
    where: { code: "MIRAAQ25" },
    update: {},
    create: {
      code: "MIRAAQ25",
      type: "FIXED",
      value: 25,
      minPurchase: 200,
      maxUses: 500,
      active: true,
    },
  });

  console.log("✅ Coupons seeded");

  const royalOud = await prisma.product.findUnique({ where: { slug: "royal-cambodian-oud" } });
  if (royalOud) {
    await prisma.review.upsert({
      where: { userId_productId: { userId: user.id, productId: royalOud.id } },
      update: {},
      create: {
        userId: user.id,
        productId: royalOud.id,
        rating: 5,
        title: "Absolutely divine",
        comment:
          "The Royal Oud is absolutely divine. It lasts all day and the compliments never stop. Miraaq has become my signature scent.",
        approved: true,
      },
    });
  }

  console.log("✅ Sample review seeded");
  console.log("\n🎉 Seeding complete!");
  console.log("\n📋 Test credentials:");
  console.log("   Admin: admin@miraaq.com / Admin@123456");
  console.log("   Customer: customer@miraaq.com / User@123456");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
