import { prisma } from "@/lib/db";

/**
 * آیا این نام کاربری آزاد است؟
 *
 * با `$queryRaw` و `lower()` انجام می‌شود، نه با `mode: "insensitive"` پریزما:
 * آن حالت روی PostgreSQL به `ILIKE` ترجمه می‌شود و `_` در نام کاربری مجاز است
 * ولی در `LIKE` یک wildcard است — یعنی `omid_` با `omidx` هم برابر می‌شد.
 * این کوئری از ایندکس `users_username_lower_key` هم استفاده می‌کند.
 */
export async function isUsernameTaken(username: string, exceptUserId?: string): Promise<boolean> {
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM users WHERE lower(username) = lower(${username}) LIMIT 1
  `;
  return rows.length > 0 && rows[0].id !== exceptUserId;
}

/**
 * پیشنهاد برای نام کاربری گرفته‌شده.
 * سمت سرور تولید می‌شود چون فقط او می‌داند چه چیزی آزاد است.
 */
export async function suggestUsernames(username: string): Promise<string[]> {
  const candidates = [
    `${username}_`,
    `${username}${Math.floor(Math.random() * 90) + 10}`,
    username.length > 3 ? `${username.slice(0, -2)}.${username.slice(-2)}` : null,
  ].filter((candidate): candidate is string => candidate !== null);

  const available: string[] = [];
  for (const candidate of candidates) {
    if (!(await isUsernameTaken(candidate))) available.push(candidate);
  }
  return available;
}
