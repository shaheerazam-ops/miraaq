import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/auth";
import { addressSchema } from "@/lib/validators/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-utils";

const updateAddressSchema = addressSchema.extend({
  id: z.string().min(1),
});

const deleteAddressSchema = z.object({
  id: z.string().min(1),
});

export async function GET() {
  try {
    const user = await requireAuth();

    const addresses = await db.address.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return apiSuccess(addresses);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const parsed = addressSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.errors.map((e) => e.message).join(", "), 400);
    }

    const data = parsed.data;

    if (data.isDefault) {
      await db.address.updateMany({
        where: { userId: user.id },
        data: { isDefault: false },
      });
    }

    const addressCount = await db.address.count({ where: { userId: user.id } });

    const address = await db.address.create({
      data: {
        userId: user.id,
        ...data,
        isDefault: data.isDefault ?? addressCount === 0,
      },
    });

    return apiSuccess(address, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const parsed = updateAddressSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.errors.map((e) => e.message).join(", "), 400);
    }

    const { id, ...data } = parsed.data;

    const existing = await db.address.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return apiError("Address not found", 404);

    if (data.isDefault) {
      await db.address.updateMany({
        where: { userId: user.id, NOT: { id } },
        data: { isDefault: false },
      });
    }

    const address = await db.address.update({
      where: { id },
      data,
    });

    return apiSuccess(address);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const parsed = deleteAddressSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.errors.map((e) => e.message).join(", "), 400);
    }

    const { id } = parsed.data;

    const existing = await db.address.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return apiError("Address not found", 404);

    await db.address.delete({ where: { id } });

    if (existing.isDefault) {
      const nextDefault = await db.address.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      });
      if (nextDefault) {
        await db.address.update({
          where: { id: nextDefault.id },
          data: { isDefault: true },
        });
      }
    }

    return apiSuccess({ message: "Address deleted" });
  } catch (error) {
    return handleApiError(error);
  }
}
