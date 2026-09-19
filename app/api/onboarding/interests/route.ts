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
 * جایگزینی کل انتخاب کاربر در **یک** statement.
 *
 * حالت ساده‌اش (پاک‌کردن همه‌چیز و درج دوباره) در یک تراکنش پنج رفت‌وبرگشت
 * می‌شد و هر کدام حدود ۳۰۰ms. اینجا به‌جایش الگوی «آنچه در ورودی نیست را پاک
 * کن، بقیه را با ON CONFLICT DO NOTHING درج کن» به کار رفته.
 *
 * نکتهٔ کلیدی همین است: **هیچ ردیفی هم‌زمان پاک و درج نمی‌شود.** CTE های
 * تغییردهنده در یک statement همگی یک snapshot می‌بینند، پس اگر ردیفی هم در
 * DELETE می‌آمد و هم در INSERT، نتیجه غیرقابل پیش‌بینی می‌شد. با این شرط‌بندی،
 * دو مجموعه هیچ اشتراکی ندارند و کل کار اتمیک است.
 *
 * دسته‌ای که هیچ زیرعلاقه‌ای ندارد با یک ردیف `(category, NULL)` می‌آید؛ در
 * درج زیرعلاقه‌ها فیلتر می‌شود ولی دسته‌اش ساخته می‌شود.
 */
async function replaceInterests(
  userId: string,
  selection: Map<string, string[]>,
): Promise<void> {
  const categoryIds: string[] = [];
  const subIds: (string | null)[] = [];

  for (const [categoryId, subs] of selection) {
    if (subs.length === 0) {
      categoryIds.push(categoryId);
      subIds.push(null);
      continue;
    }
    for (const subId of subs) {
      categoryIds.push(categoryId);
      subIds.push(subId);
    }
  }

  await prisma.$executeRaw`
    WITH incoming(category_id, sub_id) AS (
      SELECT * FROM unnest(${categoryIds}::text[], ${subIds}::text[])
    ),
    incoming_categories AS (
      SELECT DISTINCT category_id FROM incoming
    ),
    removed_subs AS (
      DELETE FROM user_interest_subs existing
      WHERE existing.user_id = ${userId}::uuid
        AND NOT EXISTS (
          SELECT 1 FROM incoming
          WHERE incoming.category_id = existing.category_id
            AND incoming.sub_id = existing.sub_id
        )
    ),
    removed_categories AS (
      DELETE FROM user_interest_categories existing
      WHERE existing.user_id = ${userId}::uuid
        AND NOT EXISTS (
          SELECT 1 FROM incoming_categories
          WHERE incoming_categories.category_id = existing.category_id
        )
    ),
    added_categories AS (
      INSERT INTO user_interest_categories (user_id, category_id)
      SELECT ${userId}::uuid, category_id FROM incoming_categories
      ON CONFLICT (user_id, category_id) DO NOTHING
    )
    INSERT INTO user_interest_subs (user_id, category_id, sub_id)
    SELECT ${userId}::uuid, category_id, sub_id FROM incoming WHERE sub_id IS NOT NULL
    ON CONFLICT (user_id, category_id, sub_id) DO NOTHING
  `;
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

  await replaceInterests(userId, selection);

  return noContent();
}
