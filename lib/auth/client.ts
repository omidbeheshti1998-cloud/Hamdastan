/**
 * تنها نقطهٔ تماس فرانت با سرور.
 *
 * فرانت فقط به بک‌اند داخلی (Route Handler های همین اپ) درخواست می‌دهد؛ تماس با
 * سرویس خارجی وظیفهٔ بک‌اند است و هرگز از مرورگر انجام نمی‌شود.
 *
 * هویت از کوکی نشست می‌آید، نه از پارامتر — به همین دلیل توابع onboarding دیگر
 * شماره نمی‌گیرند. هر مقداری که کلاینت بفرستد را خودِ کلاینت انتخاب کرده.
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

/** نام کاربری‌ای که بین بررسی و ذخیره، کس دیگری گرفته است. */
export class UsernameTakenError extends Error {
  constructor() {
    super("username already taken");
    this.name = "UsernameTakenError";
  }
}

/**
 * قطع شبکه و پاسخ ۵xx هر دو یک چیزند از دید کاربر: «نشد، دوباره تلاش کن».
 * خطای ۴xx یعنی باگ سمت ما و نباید در سکوت رد شود.
 */
async function request(path: string, init?: RequestInit): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(path, init);
  } catch {
    throw new AuthNetworkError();
  }
  if (response.status >= 500) throw new AuthNetworkError();
  return response;
}

async function postJson(path: string, body: unknown): Promise<Response> {
  return request(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** پاسخ موفق JSON، وگرنه خطای شبکه. */
async function expectJson<T>(response: Response): Promise<T> {
  if (!response.ok) throw new AuthNetworkError();
  return (await response.json()) as T;
}

function expectNoContent(response: Response): void {
  if (!response.ok) throw new AuthNetworkError();
}

/** آیا این شماره از قبل حساب کامل دارد؟ */
export async function checkMobile(mobile: string): Promise<{ registered: boolean }> {
  return expectJson(await postJson("/api/auth/check-mobile", { mobile }));
}

/** ارسال کد تأیید ۶ رقمی؛ هر بار فراخوانی، کد قبلی را باطل می‌کند. */
export async function sendOtp(mobile: string): Promise<void> {
  expectNoContent(await postJson("/api/auth/otp/send", { mobile }));
}

/** مسیر ورود. کد اشتباه خطا نیست و با `{ ok: false }` برمی‌گردد. */
export async function verifyOtp(mobile: string, code: string): Promise<{ ok: boolean }> {
  return expectJson(await postJson("/api/auth/otp/verify", { mobile, code }));
}

/**
 * پایان ثبت‌نام: تأیید کد و ساخت حساب در یک درخواست.
 * سرور هر دو را در یک تراکنش انجام می‌دهد تا شکست میانی، کاربر بی‌نام جا نگذارد.
 */
export async function register(
  mobile: string,
  code: string,
  firstName: string,
  lastName: string,
): Promise<{ ok: boolean }> {
  return expectJson(
    await postJson("/api/auth/register", { mobile, code, firstName, lastName }),
  );
}

/**
 * علایق انتخاب‌شده. فقط انتخاب خام می‌رود؛ محاسبهٔ Interest Score وظیفهٔ بک‌اند
 * است (فرمولش در `docs/ONBOARDING.md`) و هیچ‌وقت در UI دیده نمی‌شود.
 */
export async function saveInterests(selection: InterestSelection): Promise<void> {
  expectNoContent(await postJson("/api/onboarding/interests", { selection }));
}

/**
 * ترجیحات رفتاری. فقط مقدار خام هر محور (‎-1 / 0 / +1) می‌رود؛ هیچ برچسب یا
 * امتیاز شخصیتی نه محاسبه می‌شود و نه به کاربر نشان داده می‌شود.
 */
export async function savePreferences(answers: PreferenceAnswers): Promise<void> {
  expectNoContent(await postJson("/api/onboarding/preferences", { answers }));
}

export async function checkUsername(
  username: string,
): Promise<{ available: boolean; suggestions: string[] }> {
  const response = await request(
    `/api/profile/username-available?username=${encodeURIComponent(username)}`,
  );
  return expectJson(response);
}

/**
 * پروفایل نهایی onboarding.
 * عکس به‌صورت `multipart/form-data` می‌رود نه data URL — base64 حجم را یک‌سوم
 * بیشتر می‌کند و کل بدنه را در حافظه نگه می‌دارد.
 */
export async function saveProfile(identity: ProfileIdentity): Promise<void> {
  const form = new FormData();
  form.set("username", identity.username);
  form.set("bio", identity.bio);

  if (identity.avatar?.kind === "photo") {
    form.set("avatarKind", "photo");
    form.set("photo", identity.avatar.blob);
  } else if (identity.avatar?.kind === "preset") {
    form.set("avatarKind", "preset");
    form.set("avatarPresetId", identity.avatar.id);
  }

  const response = await request("/api/profile", { method: "POST", body: form });
  if (response.status === 409) throw new UsernameTakenError();
  expectNoContent(response);
}
