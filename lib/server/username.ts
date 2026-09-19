import { prisma } from "@/lib/db";

/**
 * نام‌های کاربریِ گرفته‌شده از میان یک فهرست نامزد.
 *
 * یک کوئری برای همهٔ نامزدها، نه یکی به‌ازای هر کدام: هر رفت‌وبرگشت به دیتابیس
 * حدود ۳۰۰ms است.
 *
 * مقایسه با `lower()` است و نه `mode: "insensitive"` پریزما، چون آن حالت روی
 * PostgreSQL به `ILIKE` ترجمه می‌شود و `_` در نام کاربری مجاز است ولی در `LIKE`
 * یک wildcard است — یعنی `omid_` با `omidx` هم برابر می‌شد. این کوئری از ایندکس
 * `users_username_lower_key` هم استفاده می‌کند.
 */
async function takenAmong(candidates: string[], exceptUserId?: string): Promise<Set<string>> {
  const rows = await prisma.$queryRaw<{ id: string; name: string }[]>`
    SELECT id, lower(username) AS name
    FROM users
    WHERE lower(username) = ANY(${candidates.map((name) => name.toLowerCase())}::text[])
  `;

  return new Set(
    rows.filter((row) => row.id !== exceptUserId).map((row) => row.name),
  );
}

export async function isUsernameTaken(username: string, exceptUserId?: string): Promise<boolean> {
  const taken = await takenAmong([username], exceptUserId);
  return taken.has(username.toLowerCase());
}

/**
 * وضعیت یک نام کاربری به‌همراه پیشنهادهای آزاد — همه در یک رفت‌وبرگشت.
 * پیشنهادها را سرور می‌سازد چون فقط او می‌داند چه چیزی آزاد است.
 */
export async function checkUsernameAvailability(
  username: string,
): Promise<{ available: boolean; suggestions: string[] }> {
  const candidates = [
    `${username}_`,
    `${username}${Math.floor(Math.random() * 90) + 10}`,
    username.length > 3 ? `${username.slice(0, -2)}.${username.slice(-2)}` : null,
  ].filter((candidate): candidate is string => candidate !== null);

  const taken = await takenAmong([username, ...candidates]);
  if (!taken.has(username.toLowerCase())) return { available: true, suggestions: [] };

  return {
    available: false,
    suggestions: candidates.filter((candidate) => !taken.has(candidate.toLowerCase())),
  };
}
