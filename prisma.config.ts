import { defineConfig } from "prisma/config";

// Prisma 7 دیگر `.env` را خودکار نمی‌خواند و آدرس اتصال هم از schema به اینجا
// منتقل شده. این فایل فقط برای CLI است؛ اپ Next خودش `.env` را لود می‌کند و
// اتصالش را از `lib/db.ts` می‌گیرد.
//
// نبودن `.env` خطا نیست: در ایمیج Docker فایلی وجود ندارد و متغیرها از محیط
// می‌آیند. `prisma generate` هم اصلاً به دیتابیس وصل نمی‌شود.
try {
  process.loadEnvFile(".env");
} catch {
  // فایلی نیست — متغیرها باید از محیط بیایند.
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
