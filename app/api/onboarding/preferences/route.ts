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

  await prisma.$transaction(
    [...answers].map(([dimension, answer]) =>
      prisma.userPreference.upsert({
        where: { userId_dimension: { userId, dimension } },
        create: { userId, dimension, answer },
        update: { answer },
      }),
    ),
  );

  return noContent();
}
