import { randomInt } from "node:crypto";
import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/db";
import { hashToken } from "./hash";
import { isDevSms, sendSms } from "./sms";

/** اعتبار کد — همان ۲ دقیقه‌ای که UI نشان می‌دهد. مرجع، همین مقدار سمت سرور است. */
export const OTP_TTL_MS = 2 * 60 * 1000;

/** سقف تلاش روی یک کد. بعد از آن کد سوخته است، حتی اگر درست وارد شود. */
const MAX_ATTEMPTS = 5;

const MAX_SENDS_PER_WINDOW = 5;
const SEND_WINDOW_MS = 15 * 60 * 1000;

/**
 * کد ثابت حالت توسعه. تا وقتی سرویس پیامک وصل نشده، کد تصادفی به دست کسی
 * نمی‌رسد و فلو غیرقابل تست می‌شود.
 */
const DEV_CODE = "123456";

export class OtpRateLimitError extends Error {
  constructor() {
    super("otp rate limit exceeded");
    this.name = "OtpRateLimitError";
  }
}

type Db = Prisma.TransactionClient | typeof prisma;

/** کد و شماره با هم هش می‌شوند تا هش یک کد برای دو شماره یکسان نباشد. */
const digest = (mobile: string, code: string) => hashToken(`${mobile}:${code}`);

/**
 * تولید و ارسال کد. کدهای باز همان شماره بلافاصله باطل می‌شوند، پس «ارسال مجدد»
 * کد قبلی را از کار می‌اندازد.
 */
export async function issueOtp(mobile: string): Promise<void> {
  const windowStart = new Date(Date.now() - SEND_WINDOW_MS);
  const recentSends = await prisma.otpCode.count({
    where: { mobile, createdAt: { gte: windowStart } },
  });
  if (recentSends >= MAX_SENDS_PER_WINDOW) throw new OtpRateLimitError();

  const code = isDevSms() ? DEV_CODE : String(randomInt(1_000_000)).padStart(6, "0");

  await prisma.$transaction([
    prisma.otpCode.updateMany({
      where: { mobile, consumedAt: null },
      data: { consumedAt: new Date() },
    }),
    prisma.otpCode.create({
      data: {
        mobile,
        codeHash: digest(mobile, code),
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    }),
  ]);

  await sendSms(mobile, `کد ورود شما به همدستان: ${code}`);
}

/**
 * بررسی کد و مصرف آن. `false` یعنی «کد درست نیست» — نه خطا؛ صدازننده باید
 * `{ ok: false }` برگرداند تا UI پیام «کد واردشده صحیح نیست» را نشان دهد.
 *
 * `db` می‌تواند یک تراکنش باشد، چون در مسیر ثبت‌نام مصرف کد و ساخت حساب باید
 * اتمیک باشند.
 */
export async function consumeOtp(db: Db, mobile: string, code: string): Promise<boolean> {
  // همهٔ شرط‌ها داخل همین یک UPDATE‌اند تا مسیر موفق فقط یک رفت‌وبرگشت باشد.
  // «آخرین کد» شرط لازم نیست: `issueOtp` هنگام ارسال، کدهای باز قبلی را می‌بندد،
  // پس حداکثر یک ردیف با `consumedAt = null` برای هر شماره وجود دارد.
  const { count } = await db.otpCode.updateMany({
    where: {
      mobile,
      consumedAt: null,
      codeHash: digest(mobile, code),
      expiresAt: { gt: new Date() },
      attempts: { lt: MAX_ATTEMPTS },
    },
    data: { consumedAt: new Date() },
  });

  if (count > 0) return true;

  // کد غلط بود (یا منقضی/سوخته) — شمارندهٔ تلاش فقط در همین مسیر بالا می‌رود.
  await db.otpCode.updateMany({
    where: { mobile, consumedAt: null },
    data: { attempts: { increment: 1 } },
  });
  return false;
}
