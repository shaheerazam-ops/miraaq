import { NextRequest } from "next/server";
import { contactSchema } from "@/lib/validators/auth";
import { sendContactNotification } from "@/lib/email";
import { sanitizeHtml } from "@/lib/utils";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.errors.map((e) => e.message).join(", "), 400);
    }

    const { name, email, subject, message } = parsed.data;

    const sent = await sendContactNotification({
      name: sanitizeHtml(name),
      email,
      subject: sanitizeHtml(subject),
      message: sanitizeHtml(message),
    });

    if (!sent && process.env.NODE_ENV === "production") {
      return apiError("Unable to send message at this time. Please try again later.", 503);
    }

    return apiSuccess({
      message: "Thank you for contacting us. We will get back to you shortly.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
