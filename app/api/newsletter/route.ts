import { randomBytes } from "crypto";
import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { sendNewsletterConfirmation } from "@/lib/email";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-utils";

const newsletterSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const NEWSLETTER_PREFIX = "newsletter:";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = newsletterSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.errors.map((e) => e.message).join(", "), 400);
    }

    const email = parsed.data.email.toLowerCase();
    const identifier = `${NEWSLETTER_PREFIX}${email}`;

    const existing = await db.verificationToken.findFirst({
      where: { identifier },
    });

    if (existing) {
      return apiSuccess({ message: "You are already subscribed to our newsletter." });
    }

    const token = randomBytes(16).toString("hex");
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 10);

    await db.verificationToken.create({
      data: { identifier, token, expires },
    });

    await sendNewsletterConfirmation(email);

    return apiSuccess(
      { message: "Successfully subscribed to the newsletter." },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
