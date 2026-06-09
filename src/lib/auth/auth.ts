import NextAuth, { type NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import { authConfig } from "./auth.config";

// ----------------------
// AUTH OPTIONS
// ----------------------
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  ...authConfig,
};

// ----------------------
// NEXTAUTH HANDLER (v4 style)
// ----------------------
const nextAuth = NextAuth(authOptions);

export const GET = nextAuth;
export const POST = nextAuth;

// ----------------------
// HELPERS (FIXED)
// ----------------------
export async function getCurrentUser() {
  const session = await auth();

  if (!session?.user?.id) return null;

  return db.user.findUnique({
    where: { id: session.user.id },
  });
}

// IMPORTANT: v4 does NOT expose `auth()` like v5
// so we fix it like this:
import { getServerSession } from "next-auth";

export async function auth() {
  return getServerSession(authOptions);
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== "ADMIN") throw new Error("Forbidden");
  return user;
}