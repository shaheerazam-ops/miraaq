import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-utils";
import { forgotPasswordSchema } from "@/lib/validators/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.errors[0]?.message ?? "Invalid email", 400);
    }

    const email = parsed.data.email.toLowerCase();
    const user = await db.user.findUnique({ where: { email } });

    if (user) {
      const token = randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 60 * 60 * 1000);

      await db.verificationToken.deleteMany({ where: { identifier: email } });
      await db.verificationToken.create({
        data: { identifier: email, token, expires },
      });
    }

    return apiSuccess({
      message: "If an account exists with that email, a reset link has been sent.",
    });
  } catch {
    return apiError("Unable to process request", 500);
  }
}
