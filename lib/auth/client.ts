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

/**
 * چرا خطاها از هم تفکیک شده‌اند.
 *
 * پیش‌تر هر پاسخ غیر ۲xx یک `AuthNetworkError` می‌شد و در UI «ارتباط با سرور
 * برقرار نشد» دیده می‌شد. نتیجه‌اش این بود که یک متغیر محیطیِ ست‌نشده در
 * production — که ۵۰۰ می‌داد — دقیقاً شبیه قطعی اینترنت به نظر می‌رسید، و
 * کاربر هم راهنمایی غلط می‌گرفت: «دوباره تلاش کن»، در حالی که تلاش دوباره
 * هیچ‌وقت جواب نمی‌داد. حالا هر حالت پیام و اقدام خودش را دارد.
 */

/** درخواست اصلاً به سرور نرسید یا پاسخی نیامد: قطعی شبکه یا timeout. */
export class AuthNetworkError extends Error {
  constructor() {
    super("auth network error");
    this.name = "AuthNetworkError";
  }
}

/** سرور جواب داد ولی ۵xx: خرابی سمت ماست، نه شبکهٔ کاربر. */
export class ServerError extends Error {
  constructor(readonly status: number) {
    super(`server error ${status}`);
    this.name = "ServerError";
  }
}

/** سقف ارسال کد رد شده (۴۲۹). */
export class RateLimitError extends Error {
  constructor() {
    super("rate limited");
    this.name = "RateLimitError";
  }
}

/** کوکی نشست نیست یا منقضی شده (۴۰۱) — کاربر باید از اول وارد شود. */
export class SessionExpiredError extends Error {
  constructor() {
    super("session expired");
    this.name = "SessionExpiredError";
  }
}

/** سرور ورودی را رد کرد (۴xx). یعنی باگ سمت ما؛ نباید در سکوت رد شود. */
export class RequestRejectedError extends Error {
  constructor(readonly status: number, readonly code?: string) {
    super(`request rejected ${status}${code ? `: ${code}` : ""}`);
    this.name = "RequestRejectedError";
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
 * پیام فارسیِ هر خطا — یک مرجع، تا دو مرحله دو حرف متفاوت نزنند.
 * پیام‌ها عمداً اقدامِ درست را می‌گویند، نه فقط اینکه «نشد».
 */
export function authErrorMessage(error: unknown): string {
  if (error instanceof RateLimitError) {
    return "تعداد درخواست‌ها زیاد بود. چند دقیقه صبر کن و دوباره تلاش کن.";
  }
  if (error instanceof SessionExpiredError) {
    return "نشست شما منقضی شده. لطفاً دوباره وارد شوید.";
  }
  if (error instanceof ServerError || error instanceof RequestRejectedError) {
    return "خطایی از سمت سرور رخ داد. اگر تکرار شد به پشتیبانی اطلاع بده.";
  }
  return "ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کن و دوباره تلاش کن.";
}

/**
 * سقف انتظار برای هر درخواست.
 *
 * بدون این، اگر سرور نه پاسخ بدهد و نه اتصال را ببندد — مثلاً وقتی بک‌اند به
 * دیتابیس نمی‌رسد و روی TCP معطل می‌ماند — `fetch` هرگز settle نمی‌شود و کاربر
 * یک spinner ابدی می‌بیند: نه خطایی، نه مرحلهٔ بعدی. انتظارِ بی‌پایان بدترین
 * حالت است؛ پیام خطا دست‌کم «دوباره تلاش کن» را ممکن می‌کند.
 */
const REQUEST_TIMEOUT_MS = 20_000;

/** آپلود عکس روی اینترنت کند طبیعتاً طولانی‌تر است. */
const UPLOAD_TIMEOUT_MS = 60_000;

/**
 * `AbortSignal.timeout` روی مرورگرهای قدیمی‌تر (Safari زیر ۱۶، کروم زیر ۱۰۳)
 * وجود ندارد. بدون این fallback، صدازدنش یک `TypeError` می‌انداخت که داخل همان
 * `try` گرفته می‌شد و به «ارتباط با سرور برقرار نشد» ترجمه می‌شد — روی *همهٔ*
 * درخواست‌ها و صرف‌نظر از اینکه شبکه سالم بود.
 */
function timeoutSignal(ms: number): AbortSignal {
  if (typeof AbortSignal.timeout === "function") return AbortSignal.timeout(ms);
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

/** کد خطای متنیِ سرور، اگر بدنه JSON بود. فقط برای لاگ و تشخیص. */
async function errorCode(response: Response): Promise<string | undefined> {
  try {
    const body: unknown = await response.clone().json();
    const code = (body as { error?: unknown })?.error;
    return typeof code === "string" ? code : undefined;
  } catch {
    return undefined;
  }
}

/**
 * هر حالت شکست به خطای خودش تبدیل می‌شود، و وضعیت واقعی در کنسول لاگ می‌شود.
 * آن لاگ عمدی است: وقتی روی production چیزی می‌شکند، کنسول مرورگر باید
 * وضعیت واقعی (۵۰۰؟ ۴۰۱؟ اصلاً نرسید؟) را بگوید، نه فقط پیام فارسیِ UI را.
 */
async function request(
  path: string,
  init?: RequestInit,
  { timeoutMs = REQUEST_TIMEOUT_MS, passThrough = [] as number[] } = {},
): Promise<Response> {
  const method = init?.method ?? "GET";

  let response: Response;
  try {
    response = await fetch(path, { ...init, signal: timeoutSignal(timeoutMs) });
  } catch (cause) {
    console.error(`[api] ${method} ${path} — no response`, cause);
    throw new AuthNetworkError();
  }

  if (response.ok || passThrough.includes(response.status)) return response;

  const code = await errorCode(response);
  console.error(`[api] ${method} ${path} — ${response.status}${code ? ` ${code}` : ""}`);

  if (response.status >= 500) throw new ServerError(response.status);
  if (response.status === 429) throw new RateLimitError();
  if (response.status === 401) throw new SessionExpiredError();
  throw new RequestRejectedError(response.status, code);
}

async function postJson(
  path: string,
  body: unknown,
  options?: { passThrough?: number[] },
): Promise<Response> {
  return request(
    path,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    options,
  );
}

/** بدنهٔ JSON پاسخِ موفق. حالت‌های شکست پیش از این در `request` خطا شده‌اند. */
async function json<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

/** آیا این شماره از قبل حساب کامل دارد؟ */
export async function checkMobile(mobile: string): Promise<{ registered: boolean }> {
  return json(await postJson("/api/auth/check-mobile", { mobile }));
}

/** ارسال کد تأیید ۶ رقمی؛ هر بار فراخوانی، کد قبلی را باطل می‌کند. */
export async function sendOtp(mobile: string): Promise<void> {
  await postJson("/api/auth/otp/send", { mobile });
}

/** مسیر ورود. کد اشتباه خطا نیست و با `{ ok: false }` برمی‌گردد. */
export async function verifyOtp(mobile: string, code: string): Promise<{ ok: boolean }> {
  return json(await postJson("/api/auth/otp/verify", { mobile, code }));
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
  return json(await postJson("/api/auth/register", { mobile, code, firstName, lastName }));
}

/**
 * علایق انتخاب‌شده. فقط انتخاب خام می‌رود؛ محاسبهٔ Interest Score وظیفهٔ بک‌اند
 * است (فرمولش در `docs/ONBOARDING.md`) و هیچ‌وقت در UI دیده نمی‌شود.
 */
export async function saveInterests(selection: InterestSelection): Promise<void> {
  await postJson("/api/onboarding/interests", { selection });
}

/**
 * ترجیحات رفتاری. فقط مقدار خام هر محور (‎-1 / 0 / +1) می‌رود؛ هیچ برچسب یا
 * امتیاز شخصیتی نه محاسبه می‌شود و نه به کاربر نشان داده می‌شود.
 */
export async function savePreferences(answers: PreferenceAnswers): Promise<void> {
  await postJson("/api/onboarding/preferences", { answers });
}

export async function checkUsername(
  username: string,
): Promise<{ available: boolean; suggestions: string[] }> {
  return json(
    await request(`/api/profile/username-available?username=${encodeURIComponent(username)}`),
  );
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

  // ۴۰۹ یعنی نام کاربری گرفته شده — یک نتیجهٔ معنادار برای کاربر، نه خطای سرور.
  const response = await request(
    "/api/profile",
    { method: "POST", body: form },
    { timeoutMs: UPLOAD_TIMEOUT_MS, passThrough: [409] },
  );
  if (response.status === 409) throw new UsernameTakenError();
}
