import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/auth";
import { uploadImage } from "@/lib/cloudinary";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-utils";

const uploadSchema = z.object({
  file: z.string().min(1, "File data is required"),
  folder: z.string().optional(),
});

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const contentType = req.headers.get("content-type") ?? "";
    let fileData: string;
    let folder = "miraaq/products";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file");

      if (!file || !(file instanceof File)) {
        return apiError("No file provided", 400);
      }

      if (file.size > MAX_FILE_SIZE) {
        return apiError("File size exceeds 10MB limit", 400);
      }

      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      if (!allowedTypes.includes(file.type)) {
        return apiError("Invalid file type. Allowed: JPEG, PNG, WebP, GIF", 400);
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      fileData = `data:${file.type};base64,${buffer.toString("base64")}`;

      const folderField = formData.get("folder");
      if (typeof folderField === "string" && folderField.length > 0) {
        folder = folderField;
      }
    } else {
      const body = await req.json();
      const parsed = uploadSchema.safeParse(body);

      if (!parsed.success) {
        return apiError(parsed.error.errors.map((e) => e.message).join(", "), 400);
      }

      fileData = parsed.data.file;
      if (parsed.data.folder) folder = parsed.data.folder;

      const base64Match = fileData.match(/^data:image\/\w+;base64,(.+)$/);
      if (base64Match) {
        const sizeInBytes = (base64Match[1].length * 3) / 4;
        if (sizeInBytes > MAX_FILE_SIZE) {
          return apiError("File size exceeds 10MB limit", 400);
        }
      }
    }

    const result = await uploadImage(fileData, folder);

    return apiSuccess(
      {
        url: result.url,
        publicId: result.publicId,
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
