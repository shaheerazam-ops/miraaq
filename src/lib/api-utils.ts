import { NextResponse } from "next/server";
import type { ApiResponse } from "@/types";

export function apiSuccess<T>(data: T, status = 200, meta?: ApiResponse["meta"]) {
  return NextResponse.json({ success: true, data, meta } satisfies ApiResponse<T>, { status });
}

export function apiError(error: string, status = 400) {
  return NextResponse.json({ success: false, error } satisfies ApiResponse, { status });
}

export function serializeDecimals<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj };
  for (const key of Object.keys(result)) {
    const value = result[key];
    if (value !== null && typeof value === "object" && "toNumber" in (value as object)) {
      (result as Record<string, unknown>)[key] = Number(value);
    } else if (value instanceof Date) {
      (result as Record<string, unknown>)[key] = value.toISOString();
    }
  }
  return result;
}

export function handleApiError(error: unknown) {
  console.error("API Error:", error);
  if (error instanceof Error) {
    if (error.message === "Unauthorized") return apiError("Unauthorized", 401);
    if (error.message === "Forbidden") return apiError("Forbidden", 403);
    return apiError(error.message, 500);
  }
  return apiError("Internal server error", 500);
}

export function parseSearchParams(params: URLSearchParams) {
  return {
    get: (key: string) => params.get(key) ?? undefined,
    getNum: (key: string) => {
      const val = params.get(key);
      return val ? parseFloat(val) : undefined;
    },
    getBool: (key: string) => params.get(key) === "true",
  };
}
