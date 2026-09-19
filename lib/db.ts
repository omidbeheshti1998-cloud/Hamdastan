import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { requireEnv } from "@/lib/server/env";

/**
 * تنها نمونهٔ PrismaClient اپ.
 *
 * در dev با hot-reload این ماژول بارها ارزیابی می‌شود؛ بدون نگه‌داشتن نمونه روی
 * `globalThis` هر بار یک connection pool تازه ساخته می‌شود و pool سمت
 * Prisma Postgres خیلی زود پر می‌شود.
 *
 * از Prisma 7 اتصال از طریق driver adapter برقرار می‌شود، نه از `url` در schema.
 */

/**
 * سقف زمان برقراری اتصال.
 *
 * پیش‌فرض `node-postgres` بی‌نهایت است: اگر هاست دیتابیس بسته‌ها را drop کند —
 * مثلاً وقتی خروجی شبکهٔ سرور به پورت ۵۴۳۲ باز نیست — اتصال نه برقرار می‌شود و
 * نه خطا می‌دهد، و درخواست تا ابد معلق می‌ماند. کاربر هم نه خطایی می‌بیند و نه
 * مرحلهٔ بعد را. با این سقف، همان حالت به یک خطای صریح تبدیل می‌شود.
 */
const CONNECT_TIMEOUT_MS = 10_000;

/** سقف زمان یک کوئری، برای وقتی اتصال برقرار می‌شود ولی پاسخی نمی‌آید. */
const QUERY_TIMEOUT_MS = 15_000;

const createPrismaClient = () =>
  new PrismaClient({
    adapter: new PrismaPg({
      connectionString: requireEnv("DATABASE_URL"),
      connectionTimeoutMillis: CONNECT_TIMEOUT_MS,
      query_timeout: QUERY_TIMEOUT_MS,
    }),
    log: process.env.PRISMA_LOG_QUERIES === "true" ? ["query"] : [],
  });

const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>;
};

let client: ReturnType<typeof createPrismaClient> | undefined;

function getClient() {
  if (client) return client;
  client = globalForPrisma.prisma ?? createPrismaClient();
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client;
  return client;
}

/**
 * ساخت کلاینت عمداً تا اولین استفادهٔ واقعی به تعویق می‌افتد.
 *
 * `next build` در مرحلهٔ «collecting page data» هر route را import می‌کند، و
 * داخل ایمیج داکر هیچ `DATABASE_URL` ای وجود ندارد. با ساختِ آنی در سطح
 * ماژول، همین import کافی بود تا `requireEnv` پرتاب کند و کل build بشکند —
 * در حالی که build اصلاً به دیتابیس کار ندارد.
 *
 * خطای صریحِ نبودِ متغیر از بین نمی‌رود؛ فقط به زمان اولین کوئری منتقل می‌شود،
 * یعنی همان‌جایی که واقعاً معنا دارد.
 */
export const prisma = new Proxy({} as ReturnType<typeof createPrismaClient>, {
  get(_target, property) {
    const instance = getClient();
    const value = Reflect.get(instance, property);
    // متدهای خودِ کلاینت (مثل `$transaction`) باید `this` درست داشته باشند،
    // وگرنه روی Proxy صدا زده می‌شوند.
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
