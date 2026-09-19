/**
 * متغیرهایی که نبودشان یعنی اپ اصلاً نمی‌تواند کار کند.
 *
 * پیام صریح است چون رایج‌ترین حالت خرابی همین است: در production هیچ فایل
 * `.env` داخل ایمیج نیست و متغیرها باید در تنظیمات محیطیِ سرویس ست شوند.
 * بدون این پیام، نتیجه فقط یک ۵۰۰ بی‌نشانه بود.
 */

/**
 * فهرست مرجع متغیرهای لازم.
 *
 * این فهرست جای «مستندات» نیست؛ هم `instrumentation.ts` هنگام بالا آمدن سرور و
 * هم `/api/health` از روی همین لیست گزارش می‌دهند. یعنی اضافه‌کردن یک متغیر
 * لازم به این آرایه کافی است تا هر دو جا آن را چک کنند.
 */
export const REQUIRED_ENV = {
  DATABASE_URL: "آدرس اتصال PostgreSQL",
  AUTH_SECRET: "کلید HMAC برای هش کد تأیید و توکن نشست",
} as const;

// `SMS_PROVIDER` عمداً اینجا نیست: تا وقتی هیچ سرویس واقعی‌ای وصل نشده، نبودنش
// به `dev` می‌افتد و ورود کار می‌کند. اجباری‌شدنش را خودِ `lib/server/sms.ts`
// به‌محض اضافه‌شدن اولین provider واقعی برمی‌گرداند.

export type RequiredEnvName = keyof typeof REQUIRED_ENV;

export function requireEnv(name: RequiredEnvName): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not set. No .env file ships inside the Docker image — ` +
        `set it in the service's environment settings. See .env.example.`,
    );
  }
  return value;
}

/** نام متغیرهای لازمی که ست نشده‌اند. خالی بودنش یعنی محیط کامل است. */
export function missingEnv(): RequiredEnvName[] {
  return (Object.keys(REQUIRED_ENV) as RequiredEnvName[]).filter(
    (name) => !process.env[name],
  );
}
