/**
 * تنها نقطهٔ تماس با سرویس پیامک.
 *
 * هیچ جای دیگری از اپ نباید با سرویس خارجی حرف بزند؛ وصل‌کردن پنل واقعی یعنی
 * اضافه‌کردن یک provider به همین فایل و عوض‌کردن `SMS_PROVIDER`.
 */

type SmsProvider = (mobile: string, text: string) => Promise<void>;

/** پیامکی فرستاده نمی‌شود؛ متن در لاگ سرور می‌آید تا در توسعه قابل خواندن باشد. */
const devProvider: SmsProvider = async (mobile, text) => {
  console.info(`[sms:dev] ${mobile} ← ${text}`);
};

const DEV = "dev";

const PROVIDERS: Record<string, SmsProvider> = {
  [DEV]: devProvider,
};

/** provider هایی که واقعاً پیامک می‌فرستند — یعنی هر چیزی جز `dev`. */
const REAL_PROVIDERS = Object.keys(PROVIDERS).filter((name) => name !== DEV);

export const SMS_PROVIDER_NAMES = Object.keys(PROVIDERS);

/**
 * وقتی هنوز هیچ سرویس واقعی‌ای وصل نیست، نبودِ `SMS_PROVIDER` نباید کل ورود را
 * بخواباند — تنها رفتار ممکن همان `dev` است و کد تأیید `123456`. یک‌بار همین
 * متغیرِ جاافتاده باعث شد `/api/auth/otp/send` در production ۵۰۰ بدهد و چون هر
 * دو مسیر ورود و ثبت‌نام از OTP رد می‌شوند، کل اپ از کار بیفتد.
 *
 * **این پیش‌فرض خودش را جمع می‌کند.** به‌محض اینکه اولین provider واقعی به
 * `PROVIDERS` اضافه شود، `REAL_PROVIDERS` دیگر خالی نیست و `SMS_PROVIDER`
 * دوباره اجباری می‌شود. بدون این شرط، یک متغیرِ جاافتاده در production یعنی کد
 * ورودِ *همه* می‌شود `123456` — یعنی هر کسی با هر شماره‌ای وارد می‌شود.
 */
const DEFAULT_PROVIDER = REAL_PROVIDERS.length === 0 ? DEV : null;

/** نام provider ای که واقعاً استفاده می‌شود، یا `null` اگر تنظیمات ناقص است. */
function resolvedProviderName(): string | null {
  const configured = process.env.SMS_PROVIDER;
  if (!configured) return DEFAULT_PROVIDER;
  return PROVIDERS[configured] ? configured : null;
}

/** کد تأیید ثابت است و پیامکی فرستاده نمی‌شود. */
export function isDevSms(): boolean {
  return resolvedProviderName() === DEV;
}

/**
 * وضعیت تنظیمات پیامک — بدون ارسال چیزی.
 *
 * `error` یعنی ارسال کد تأیید شکست می‌خورد. `warning` یعنی کار می‌کند ولی آن
 * چیزی نیست که در production می‌خواهی. `/api/health` و بررسی هنگام بالا آمدن
 * سرور از همین می‌خوانند، تا خرابیِ تنظیمات پیش از رسیدن اولین کاربر دیده شود.
 */
export function smsStatus(): { level: "ok" | "warning" | "error"; detail?: string } {
  const configured = process.env.SMS_PROVIDER;

  if (configured && !PROVIDERS[configured]) {
    return {
      level: "error",
      detail: `SMS_PROVIDER="${configured}" has no implementation in lib/server/sms.ts. Known: ${SMS_PROVIDER_NAMES.join(", ")}.`,
    };
  }

  if (!configured && DEFAULT_PROVIDER === null) {
    return {
      level: "error",
      detail: `SMS_PROVIDER is not set and there is no default. Set it to one of: ${SMS_PROVIDER_NAMES.join(", ")}.`,
    };
  }

  if (resolvedProviderName() === DEV) {
    return {
      level: "warning",
      detail:
        `SMS provider is "${DEV}"${configured ? "" : " (default — SMS_PROVIDER is not set)"}: ` +
        `no real SMS is sent and the verification code is always 123456. ` +
        `Anyone who knows a mobile number can sign in.`,
    };
  }

  return { level: "ok" };
}

export async function sendSms(mobile: string, text: string): Promise<void> {
  const name = resolvedProviderName();
  if (!name) throw new Error(smsStatus().detail ?? "SMS provider is not configured");

  await PROVIDERS[name](mobile, text);
}
