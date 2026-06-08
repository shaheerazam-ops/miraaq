import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().min(1),
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().min(1),
  TAX_RATE: z.string().default("0.08"),
  FREE_SHIPPING_THRESHOLD: z.string().default("150"),
  SHIPPING_FLAT_RATE: z.string().default("9.99"),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    if (process.env.NODE_ENV === "production" && process.env.NEXTAUTH_SECRET) {
      console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
      throw new Error("Invalid environment variables");
    }
    // Development/build fallbacks
    return {
      NODE_ENV: (process.env.NODE_ENV as Env["NODE_ENV"]) || "development",
      DATABASE_URL: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/miraaq",
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || "http://localhost:3000",
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "dev-secret-key-minimum-32-characters-long",
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "placeholder",
      CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "placeholder",
      CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "placeholder",
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "placeholder",
      TAX_RATE: process.env.TAX_RATE || "0.08",
      FREE_SHIPPING_THRESHOLD: process.env.FREE_SHIPPING_THRESHOLD || "150",
      SHIPPING_FLAT_RATE: process.env.SHIPPING_FLAT_RATE || "9.99",
    } as Env;
  }
  return parsed.data;
}

export const env = validateEnv();

export const appConfig = {
  name: "Miraaq",
  tagline: "Modern Luxury Fragrance House",
  description:
    "Discover Miraaq — a modern luxury fragrance house inspired by timeless elegance, crafted with premium oud, amber, and oriental accords.",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  taxRate: parseFloat(process.env.TAX_RATE || "0.08"),
  freeShippingThreshold: parseFloat(process.env.FREE_SHIPPING_THRESHOLD || "150"),
  shippingFlatRate: parseFloat(process.env.SHIPPING_FLAT_RATE || "9.99"),
  currency: "PKR",
  currencySymbol: "Rs",
  supportEmail: "support@miraaq.com",
  whatsappNumber: "+971501234567",
  social: {
    instagram: "https://instagram.com/miraaq",
    facebook: "https://facebook.com/miraaq",
    twitter: "https://twitter.com/miraaq",
    youtube: "https://youtube.com/miraaq",
  },
};