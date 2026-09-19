import { prisma } from "@/lib/db";
import { PREFERENCE_QUESTIONS } from "@/lib/preferences";
import { badRequest, noContent, readJson, unauthorized } from "@/lib/server/request";
import { currentUserId } from "@/lib/server/session";

const VALID_DIMENSIONS = new Set(PREFERENCE_QUESTIONS.map((question) => question.id));

function parseAnswers(value: unknown): Map<string, number> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;

  const answers = new Map<string, number>();
  for (const [dimension, answer] of Object.entries(value)) {
    if (!VALID_DIMENSIONS.has(dimension)) return null;
    if (answer !== -1 && answer !== 0 && answer !== 1) return null;
    answers.set(dimension, answer);
  }
  return answers;
}

/**
 * پاسخ‌های کوییز ترجیحات. فقط مقدار خام هر محور ذخیره می‌شود؛ هیچ برچسب یا
 * امتیاز شخصیتی نه حساب می‌شود و نه ذخیره.
 *
 * کوییز قابل رد کردن و تکرار است، پس `upsert` می‌کنیم نه `create`.
 */
export async function POST(request: Request) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();

  const body = await readJson(request);
  const answers = parseAnswers(body?.answers);
  if (!answers) return badRequest("invalid_answers");

  // یک statement برای همهٔ محورها.
  // هر رفت‌وبرگشت به دیتابیس حدود ۳۰۰ms است، پس هفت `upsert` جدا یعنی هفت برابر
  // انتظار برای کاربر. پریزما upsert چندردیفی ندارد، برای همین SQL خام.
  const dimensions = [...answers.keys()];
  const values = [...answers.values()];

  await prisma.$executeRaw`
    INSERT INTO user_preferences (user_id, dimension, answer, updated_at)
    SELECT ${userId}::uuid, d, a, now()
    FROM unnest(${dimensions}::text[], ${values}::int[]) AS t(d, a)
    ON CONFLICT (user_id, dimension)
    DO UPDATE SET answer = EXCLUDED.answer, updated_at = now()
  `;

  return noContent();
}
