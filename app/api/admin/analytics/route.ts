import { requireAdmin } from "@/lib/auth/auth";
import { getAdminAnalytics } from "@/services/product.service";
import { apiSuccess, handleApiError } from "@/lib/api-utils";

export async function GET() {
  try {
    await requireAdmin();
    const analytics = await getAdminAnalytics();
    return apiSuccess(analytics);
  } catch (error) {
    return handleApiError(error);
  }
}
