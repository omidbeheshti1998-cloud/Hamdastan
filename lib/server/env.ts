/**
 * متغیرهایی که نبودشان یعنی اپ اصلاً نمی‌تواند کار کند.
 *
 * پیام صریح است چون رایج‌ترین حالت خرابی همین است: در production هیچ فایل
 * `.env` داخل ایمیج نیست و متغیرها باید در تنظیمات محیطیِ سرویس ست شوند.
 * بدون این پیام، نتیجه فقط یک ۵۰۰ بی‌نشانه بود.
 */
export function requireEnv(name: "DATABASE_URL" | "AUTH_SECRET"): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not set. No .env file ships inside the Docker image — ` +
        `set it in the service's environment settings. See .env.example.`,
    );
  }
  return value;
}
