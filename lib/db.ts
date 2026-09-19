import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

/**
 * تنها نمونهٔ PrismaClient اپ.
 *
 * در dev با hot-reload این ماژول بارها ارزیابی می‌شود؛ بدون نگه‌داشتن نمونه روی
 * `globalThis` هر بار یک connection pool تازه ساخته می‌شود و pool سمت
 * Prisma Postgres خیلی زود پر می‌شود.
 *
 * از Prisma 7 اتصال از طریق driver adapter برقرار می‌شود، نه از `url` در schema.
 */

const createPrismaClient = () =>
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
    log: process.env.PRISMA_LOG_QUERIES === "true" ? ["query"] : [],
  });

const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
