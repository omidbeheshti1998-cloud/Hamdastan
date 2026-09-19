import { defineConfig } from "prisma/config";

// Prisma 7 دیگر `.env` را خودکار نمی‌خواند و آدرس اتصال هم از schema به اینجا
// منتقل شده. این فایل فقط برای CLI است؛ اپ Next خودش `.env` را لود می‌کند و
// اتصالش را از `lib/db.ts` می‌گیرد.
process.loadEnvFile?.(".env");

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
