import type { Instrumentation } from "next";

/**
 * بررسی تنظیمات هنگام بالا آمدن سرور، و لاگ خطاهای سمت سرور با مسیرشان.
 *
 * `register` یک‌بار و پیش از پذیرفتن اولین درخواست اجرا می‌شود.
 */

/**
 * عمداً throw نمی‌کند.
 *
 * انداختن خطا کانتینر را در حلقهٔ ری‌استارت می‌گذاشت و صفحهٔ ورود را هم — که
 * اصلاً به پیامک کاری ندارد — از دسترس خارج می‌کرد. آنچه لازم بود این است که
 * خرابی *دیده* شود، نه اینکه سرویس پایین بیاید؛ پس اینجا فریاد می‌زند و
 * `/api/health` همان را با ۵۰۳ برمی‌گرداند.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { missingEnv, REQUIRED_ENV } = await import("@/lib/server/env");
  const { smsStatus } = await import("@/lib/server/sms");

  const sms = smsStatus();

  const problems = [
    ...missingEnv().map((name) => `${name} is not set — ${REQUIRED_ENV[name]}`),
    ...(sms.level === "error" && sms.detail ? [sms.detail] : []),
  ];

  if (problems.length > 0) {
    console.error(
      `[config] ${problems.length} problem(s) — requests that need them will fail with 500:\n` +
        problems.map((problem) => `  • ${problem}`).join("\n") +
        "\nNo .env file ships inside the Docker image; set these in the service's " +
        "environment settings. See .env.example, and GET /api/health for live status.",
    );
  } else {
    console.info("[config] ok — required environment variables are set");
  }

  // هشدار حتی وقتی همه‌چیز «سالم» است: حالت dev کار می‌کند، ولی کد تأیید ثابت
  // است و این چیزی نیست که بی‌خبر در production بماند.
  if (sms.level === "warning" && sms.detail) {
    console.warn(`[config] warning — ${sms.detail}`);
  }
}

/**
 * هر خطای گرفته‌نشدهٔ سرور، با مسیری که در آن رخ داده.
 *
 * بدون این، یک ۵۰۰ فقط به‌صورت «ارتباط با سرور برقرار نشد» به کاربر می‌رسید و
 * در لاگ هم مسیرش معلوم نبود.
 */
export const onRequestError: Instrumentation.onRequestError = (error, request, context) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(
    `[error] ${request.method} ${request.path} (${context.routeType}) — ${message}`,
  );
};
