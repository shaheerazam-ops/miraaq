import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-utils";
import { addressSchema } from "@/lib/validators/auth";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const { id } = await params;
  const existing = await db.address.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) return apiError("Address not found", 404);

  const body = await request.json();
  const parsed = addressSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.errors[0]?.message ?? "Invalid address", 400);
  }

  if (parsed.data.isDefault) {
    await db.address.updateMany({
      where: { userId: session.user.id, NOT: { id } },
      data: { isDefault: false },
    });
  }

  const address = await db.address.update({
    where: { id },
    data: parsed.data,
  });

  return apiSuccess(address);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const { id } = await params;
  const existing = await db.address.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) return apiError("Address not found", 404);

  await db.address.delete({ where: { id } });

  if (existing.isDefault) {
    const next = await db.address.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });
    if (next) {
      await db.address.update({ where: { id: next.id }, data: { isDefault: true } });
    }
  }

  return apiSuccess({ deleted: true });
}
