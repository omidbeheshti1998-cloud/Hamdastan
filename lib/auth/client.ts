/**
 * تنها نقطهٔ تماس فرانت با «سرور» در فلو احراز هویت.
 *
 * فعلاً پیاده‌سازی Mock است (فقط UI ساخته شده). وقتی بک‌اند داخلی آماده شد،
 * بدنهٔ همین توابع به `fetch("/api/auth/…")` تبدیل می‌شود و هیچ کامپوننتی
 * لازم نیست تغییر کند. فرانت هرگز مستقیم به سرویس خارجی درخواست نمی‌زند —
 * آن تماس وظیفهٔ Route Handler های داخلی است.
 *
 *   checkMobile    → POST /api/auth/check-mobile
 *   sendOtp        → POST /api/auth/otp/send
 *   verifyOtp      → POST /api/auth/otp/verify
 *   register       → POST /api/auth/register
 *   saveInterests  → POST /api/onboarding/interests
 *   savePreferences → POST /api/onboarding/preferences
 *   checkUsername  → GET  /api/profile/username-available
 *   saveProfile    → POST /api/profile
 */

import type { InterestSelection } from "@/lib/interests";
import type { PreferenceAnswers } from "@/lib/preferences";
import type { ProfileIdentity } from "@/lib/profile";

/** خطای شبکه/سرور — در UI به «ارتباط با سرور برقرار نشد» ترجمه می‌شود. */
export class AuthNetworkError extends Error {
  constructor() {
    super("auth network error");
    this.name = "AuthNetworkError";
  }
}

/** کد صحیح در حالت Mock. */
export const MOCK_OTP = "123456";

/** وارد کردن این کد در حالت Mock خطای شبکه شبیه‌سازی می‌کند. */
const MOCK_NETWORK_ERROR_OTP = "000000";

const MOCK_LATENCY_MS = 700;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** تنها شماره‌ای که در حالت Mock «حساب دارد» و به مسیر OTP می‌رود. */
export const MOCK_REGISTERED_MOBILE = "09050466960";

/** آیا این شماره از قبل حساب دارد؟ Mock: فقط `MOCK_REGISTERED_MOBILE`؛ بقیه به ثبت‌نام می‌روند. */
export async function checkMobile(mobile: string): Promise<{ registered: boolean }> {
  await delay(MOCK_LATENCY_MS);
  return { registered: mobile === MOCK_REGISTERED_MOBILE };
}

/** ارسال کد تأیید ۶ رقمی؛ هر بار فراخوانی، کد قبلی را باطل می‌کند. */
export async function sendOtp(_mobile: string): Promise<void> {
  await delay(MOCK_LATENCY_MS);
}

export async function verifyOtp(
  _mobile: string,
  code: string,
): Promise<{ ok: boolean }> {
  await delay(MOCK_LATENCY_MS);
  if (code === MOCK_NETWORK_ERROR_OTP) throw new AuthNetworkError();
  return { ok: code === MOCK_OTP };
}

/**
 * علایق انتخاب‌شده در مرحلهٔ onboarding.
 * فقط انتخاب خام فرستاده می‌شود؛ محاسبهٔ Interest Score وظیفهٔ بک‌اند است
 * (فرمولش در `docs/ONBOARDING.md`) و هیچ‌وقت در UI دیده نمی‌شود.
 */
export async function saveInterests(
  _mobile: string,
  _selection: InterestSelection,
): Promise<void> {
  await delay(MOCK_LATENCY_MS);
}

/**
 * ترجیحات رفتاری (مرحلهٔ «یکم بیشتر بشناسیمت»).
 * فقط مقدار خام هر محور (‎-1 / 0 / +1) می‌رود؛ هیچ برچسب یا امتیاز شخصیتی
 * نه محاسبه می‌شود و نه به کاربر نشان داده می‌شود.
 */
export async function savePreferences(
  _mobile: string,
  _answers: PreferenceAnswers,
): Promise<void> {
  await delay(MOCK_LATENCY_MS);
}

/** نام‌های کاربری‌ای که در حالت Mock «گرفته‌شده» حساب می‌شوند. */
const MOCK_TAKEN_USERNAMES = ["mahdish", "omid", "admin", "test", "user", "hamdastan"];

/**
 * پیشنهادها در نسخهٔ واقعی از بک‌اند می‌آیند (چون فقط او می‌داند چه چیزی آزاد
 * است). این تولیدکنندهٔ Mock عمداً قطعی است تا با هر رندر عوض نشود.
 */
function mockSuggestions(username: string): string[] {
  const seed = [...username].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const suggestions = [`${username}_`, `${username}${(seed % 90) + 10}`];
  if (username.length > 3) {
    suggestions.push(`${username.slice(0, -2)}.${username.slice(-2)}`);
  }
  return suggestions.filter((item) => !MOCK_TAKEN_USERNAMES.includes(item));
}

export async function checkUsername(
  username: string,
): Promise<{ available: boolean; suggestions: string[] }> {
  await delay(MOCK_LATENCY_MS);
  const available = !MOCK_TAKEN_USERNAMES.includes(username.toLowerCase());
  return { available, suggestions: available ? [] : mockSuggestions(username) };
}

/**
 * پروفایل نهایی onboarding.
 * در نسخهٔ واقعی عکس باید به‌صورت `multipart/form-data` برود، نه data URL —
 * جزئیات در `docs/PROFILE.md`.
 */
export async function saveProfile(
  _mobile: string,
  _identity: ProfileIdentity,
): Promise<void> {
  await delay(MOCK_LATENCY_MS);
}

export async function register(
  _mobile: string,
  _firstName: string,
  _lastName: string,
): Promise<void> {
  await delay(MOCK_LATENCY_MS);
}
