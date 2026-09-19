import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * هش کد تأیید و توکن نشست.
 *
 * HMAC است و نه هش ساده: کد تأیید فقط ۶ رقم دارد و هش خامش با یک جدول آماده
 * فوراً برمی‌گردد. با کلید سرور، دامپ دیتابیس به‌تنهایی به کد نمی‌رسد.
 */
export function hashToken(value: string): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return createHmac("sha256", secret).update(value).digest("hex");
}

/** مقایسهٔ دو هش hex در زمان ثابت. */
export function hashesMatch(a: string, b: string): boolean {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  return left.length === right.length && timingSafeEqual(left, right);
}
