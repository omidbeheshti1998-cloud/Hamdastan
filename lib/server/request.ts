import { isValidMobile, normalizeMobile } from "@/lib/auth/mobile";

/** بدنهٔ JSON، یا `null` اگر اصلاً JSON نبود. */
export async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();
    return typeof body === "object" && body !== null ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/**
 * شمارهٔ نرمال‌شده، یا `null` اگر معتبر نبود.
 * سرور خودش نرمال می‌کند و به نرمال‌سازی کلاینت تکیه نمی‌کند.
 */
export function readMobile(value: unknown): string | null {
  const mobile = normalizeMobile(typeof value === "string" ? value : "");
  return isValidMobile(mobile) ? mobile : null;
}

/** کد ۶ رقمی، یا `null`. */
export function readOtpCode(value: unknown): string | null {
  return typeof value === "string" && /^\d{6}$/.test(value) ? value : null;
}

export const badRequest = (error: string) => Response.json({ error }, { status: 400 });
export const unauthorized = () => Response.json({ error: "unauthorized" }, { status: 401 });
export const noContent = () => new Response(null, { status: 204 });
