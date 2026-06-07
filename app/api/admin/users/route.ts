import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/auth";
import { apiSuccess, handleApiError, parseSearchParams } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { get, getNum } = parseSearchParams(req.nextUrl.searchParams);
    const page = getNum("page") ?? 1;
    const limit = getNum("limit") ?? 20;
    const search = get("search");
    const role = get("role");
    const skip = (page - 1) * limit;

    const where: {
      role?: "USER" | "ADMIN";
      OR?: Array<{ email?: { contains: string; mode: "insensitive" }; name?: { contains: string; mode: "insensitive" } }>;
    } = {};

    if (role === "USER" || role === "ADMIN") {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { orders: true, reviews: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.user.count({ where }),
    ]);

    return apiSuccess(users, 200, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
