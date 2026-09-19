import { prisma } from "@/lib/db";
import { missingEnv, REQUIRED_ENV } from "@/lib/server/env";
import { smsStatus } from "@/lib/server/sms";

/**
 * وضعیت واقعی سرویس در همین لحظه — برای بعد از هر deploy.
 *
 * انگیزه‌اش یک اتفاق واقعی است: `SMS_PROVIDER` در production ست نشده بود و تنها
 * نشانه‌اش یک ۵۰۰ روی `/api/auth/otp/send` بود که در UI به «ارتباط با سرور
 * برقرار نشد» ترجمه می‌شد — یعنی یک متغیر محیطیِ نبود، شبیه قطعی شبکه دیده می‌شد.
 * با این اندپوینت همان خرابی با یک `curl` و پیش از رسیدن اولین کاربر معلوم می‌شود.
 *
 * هیچ مقدار محرمانه‌ای برنمی‌گردد: فقط نامِ متغیرِ نبوده و کدِ خطای دیتابیس.
 * متن کامل خطا در لاگ سرور می‌ماند، نه در پاسخ.
 */

/** ۵۴۳۲ بسته است یا دیتابیس خواب است — بیش از این منتظر ماندن چیزی روشن نمی‌کند. */
const DB_PROBE_TIMEOUT_MS = 8_000;

type Check = { ok: boolean; detail?: string };

async function checkDatabase(): Promise<Check & { latencyMs?: number }> {
  const startedAt = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true, latencyMs: Date.now() - startedAt };
  } catch (error) {
    // پیام خام می‌تواند هاست و پورت دیتابیس را لو بدهد، پس فقط کدش بیرون می‌آید.
    console.error("[health] database check failed", error);
    const code = (error as { code?: unknown })?.code;
    return {
      ok: false,
      detail: typeof code === "string" ? code : "query failed",
      latencyMs: Date.now() - startedAt,
    };
  }
}

export async function GET() {
  const missing = missingEnv();
  const env: Check = {
    ok: missing.length === 0,
    detail: missing.length
      ? `not set: ${missing.map((name) => `${name} (${REQUIRED_ENV[name]})`).join("، ")}`
      : undefined,
  };

  // حالت `dev` خرابی نیست ولی سالم هم نیست: ورود کار می‌کند و کد تأیید ثابت
  // است. پس `ok` می‌ماند و به‌جایش در `warnings` بالا می‌آید تا دیده شود.
  const smsLevel = smsStatus();
  const sms: Check = { ok: smsLevel.level !== "error", detail: smsLevel.detail };

  // بدون `DATABASE_URL` اصلاً کوئری‌ای در کار نیست؛ زدنش فقط همان خطای نبودِ
  // متغیر را دوباره تکرار می‌کند و ۸ ثانیه هم معطل می‌شود.
  const database = process.env.DATABASE_URL
    ? await Promise.race([
        checkDatabase(),
        new Promise<Check>((resolve) =>
          setTimeout(
            () => resolve({ ok: false, detail: `no answer in ${DB_PROBE_TIMEOUT_MS}ms` }),
            DB_PROBE_TIMEOUT_MS,
          ),
        ),
      ])
    : ({ ok: false, detail: "DATABASE_URL is not set" } satisfies Check);

  const ok = env.ok && sms.ok && database.ok;
  const warnings = smsLevel.level === "warning" && smsLevel.detail ? [smsLevel.detail] : [];

  return Response.json(
    { ok, warnings, checks: { env, database, sms } },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
