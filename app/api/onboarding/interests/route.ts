import { prisma } from "@/lib/db";
import { INTEREST_CATEGORIES, MIN_INTEREST_CATEGORIES } from "@/lib/interests";
import { badRequest, noContent, readJson, unauthorized } from "@/lib/server/request";
import { currentUserId } from "@/lib/server/session";

/** `شناسهٔ دسته → مجموعهٔ زیرعلاقه‌های معتبرش` — مرجع اعتبارسنجی سمت سرور. */
const VALID_SUBS = new Map(
  INTEREST_CATEGORIES.map((category) => [
    category.id,
    new Set(category.subInterests.map((sub) => sub.id)),
  ]),
);

/** انتخاب خام را می‌پذیرد و `id` ناشناخته را رد می‌کند (نه اینکه نادیده بگیرد). */
function parseSelection(value: unknown): Map<string, string[]> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;

  const selection = new Map<string, string[]>();
  for (const [categoryId, subIds] of Object.entries(value)) {
    const validSubs = VALID_SUBS.get(categoryId);
    if (!validSubs) return null;
    if (!Array.isArray(subIds)) return null;

    const subs = [...new Set(subIds)];
    if (subs.some((sub) => typeof sub !== "string" || !validSubs.has(sub))) return null;

    selection.set(categoryId, subs as string[]);
  }
  return selection;
}

/**
 * علایق کاربر. Interest Score اینجا ذخیره نمی‌شود — از روی همین انتخاب خام
 * حساب می‌شود (فرمول در `docs/ONBOARDING.md`).
 *
 * هر بار کل انتخاب جایگزین می‌شود، نه اینکه روی قبلی اضافه شود؛ «حذف یک دسته»
 * جز این شکل دیگری ندارد.
 */
export async function POST(request: Request) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();

  const body = await readJson(request);
  const selection = parseSelection(body?.selection);
  if (!selection) return badRequest("invalid_selection");
  // قاعدهٔ حداقل تعداد دسته سمت سرور هم اعمال می‌شود؛ کلاینت فقط CTA را قفل می‌کند.
  if (selection.size < MIN_INTEREST_CATEGORIES) return badRequest("too_few_categories");

  await prisma.$transaction([
    // زیرعلاقه‌ها با cascade پاک می‌شوند.
    prisma.userInterestCategory.deleteMany({ where: { userId } }),
    prisma.userInterestCategory.createMany({
      data: [...selection.keys()].map((categoryId) => ({ userId, categoryId })),
    }),
    prisma.userInterestSub.createMany({
      data: [...selection].flatMap(([categoryId, subIds]) =>
        subIds.map((subId) => ({ userId, categoryId, subId })),
      ),
    }),
  ]);

  return noContent();
}
