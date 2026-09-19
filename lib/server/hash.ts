import { createHmac } from "node:crypto";
import { requireEnv } from "./env";

/**
 * هش کد تأیید و توکن نشست.
 *
 * HMAC است و نه هش ساده: کد تأیید فقط ۶ رقم دارد و هش خامش با یک جدول آماده
 * فوراً برمی‌گردد. با کلید سرور، دامپ دیتابیس به‌تنهایی به کد نمی‌رسد.
 */
export function hashToken(value: string): string {
  return createHmac("sha256", requireEnv("AUTH_SECRET")).update(value).digest("hex");
}
