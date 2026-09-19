import { AVATARS, BIO_MAX_LENGTH, isValidUsername } from "@/lib/profile";
import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import { badRequest, noContent, unauthorized } from "@/lib/server/request";
import { currentUserId } from "@/lib/server/session";

const PRESET_IDS = new Set(AVATARS.map((avatar) => avatar.id));

/** همان سقف و نوع‌هایی که CHECK constraint جدول `user_avatars` اعمال می‌کند. */
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/**
 * مرحلهٔ آخر onboarding: نام کاربری، آواتار و بیو.
 *
 * `multipart/form-data` است نه JSON، چون عکس آواتار باید به‌صورت باینری برود
 * و نه data URL — base64 حجم را یک‌سوم بیشتر می‌کند و کل بدنه را در حافظه نگه می‌دارد.
 *
 * موفقیت اینجا یعنی onboarding تمام شد، پس `onboardedAt` هم ست می‌شود.
 */
export async function POST(request: Request) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return badRequest("invalid_body");
  }

  const username = String(form.get("username") ?? "");
  if (!isValidUsername(username)) return badRequest("invalid_username");

  const bio = String(form.get("bio") ?? "").trim();
  if (bio.length > BIO_MAX_LENGTH) return badRequest("bio_too_long");

  const avatarKind = String(form.get("avatarKind") ?? "");
  const photo = form.get("photo");
  const presetId = String(form.get("avatarPresetId") ?? "");

  if (avatarKind === "preset") {
    if (!PRESET_IDS.has(presetId)) return badRequest("invalid_avatar");
  } else if (avatarKind === "photo") {
    if (!(photo instanceof File)) return badRequest("invalid_avatar");
    if (photo.size === 0 || photo.size > MAX_PHOTO_BYTES) return badRequest("photo_too_large");
    if (!ALLOWED_MIME_TYPES.has(photo.type)) return badRequest("unsupported_photo_type");
  } else {
    return badRequest("invalid_avatar");
  }

  const photoBytes =
    avatarKind === "photo" && photo instanceof File
      ? Buffer.from(await photo.arrayBuffer())
      : null;

  // پروفایل و آواتار در یک statement به‌روز می‌شوند، نه در یک تراکنش تعاملی:
  // تراکنش تعاملی یعنی BEGIN و هر دستور و COMMIT هر کدام یک رفت‌وبرگشت جدا،
  // و هر رفت‌وبرگشت حدود ۳۰۰ms. دو جدول متفاوت‌اند، پس CTE اینجا کاملاً بی‌خطر است.
  //
  // یکتایی نام کاربری از قبل بررسی نمی‌شود: آن یک کوئری اضافه بود و حرف آخر را
  // هم نمی‌زد، چون بین بررسی و درج کسی می‌تواند همان نام را بگیرد. ایندکس یکتا
  // تنها مرجع است و نقضش به `409` ترجمه می‌شود.
  const updateUser = Prisma.sql`
    UPDATE users SET
      username = ${username},
      bio = ${bio || null},
      avatar_kind = ${avatarKind},
      avatar_preset_id = ${avatarKind === "preset" ? presetId : null},
      onboarded_at = now(),
      updated_at = now()
    WHERE id = ${userId}::uuid
  `;

  try {
    if (photoBytes && photo instanceof File) {
      await prisma.$executeRaw`
        WITH updated AS (${updateUser})
        INSERT INTO user_avatars (user_id, mime_type, byte_size, data, updated_at)
        VALUES (${userId}::uuid, ${photo.type}, ${photoBytes.byteLength}, ${photoBytes}, now())
        ON CONFLICT (user_id) DO UPDATE SET
          mime_type = EXCLUDED.mime_type,
          byte_size = EXCLUDED.byte_size,
          data = EXCLUDED.data,
          updated_at = now()
      `;
    } else {
      // انتخاب آواتار آماده، عکس قبلی را کنار می‌گذارد.
      await prisma.$executeRaw`
        WITH updated AS (${updateUser})
        DELETE FROM user_avatars WHERE user_id = ${userId}::uuid
      `;
    }
  } catch (error) {
    if (isUniqueViolation(error)) {
      return Response.json({ error: "username_taken" }, { status: 409 });
    }
    throw error;
  }

  return noContent();
}

/** نقض ایندکس یکتا — چه از پریزما بیاید (`P2002`) چه از خود PostgreSQL (`23505`). */
function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const code = (error as { code?: unknown }).code;
  if (code === "P2002" || code === "23505") return true;
  return isUniqueViolation((error as { cause?: unknown }).cause);
}
