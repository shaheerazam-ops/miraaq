import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-utils";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const { productId } = await params;

  await db.wishlistItem.deleteMany({
    where: { userId: session.user.id, productId },
  });

  return apiSuccess({ removed: true });
}
