import { AVATARS, BIO_MAX_LENGTH, isValidUsername } from "@/lib/profile";
import { prisma } from "@/lib/db";
import { badRequest, noContent, unauthorized } from "@/lib/server/request";
import { currentUserId } from "@/lib/server/session";
import { isUsernameTaken } from "@/lib/server/username";

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

  if (await isUsernameTaken(username, userId)) {
    return Response.json({ error: "username_taken" }, { status: 409 });
  }

  const photoBytes =
    avatarKind === "photo" && photo instanceof File
      ? Buffer.from(await photo.arrayBuffer())
      : null;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          username,
          bio: bio || null,
          avatarKind,
          avatarPresetId: avatarKind === "preset" ? presetId : null,
          onboardedAt: new Date(),
        },
      });

      if (photoBytes && photo instanceof File) {
        await tx.userAvatar.upsert({
          where: { userId },
          create: {
            userId,
            mimeType: photo.type,
            byteSize: photoBytes.byteLength,
            data: photoBytes,
          },
          update: {
            mimeType: photo.type,
            byteSize: photoBytes.byteLength,
            data: photoBytes,
          },
        });
      } else {
        // انتخاب آواتار آماده، عکس قبلی را کنار می‌گذارد.
        await tx.userAvatar.deleteMany({ where: { userId } });
      }
    });
  } catch (error) {
    // مسابقه بین بررسی بالا و همین insert: ایندکس یکتا حرف آخر را می‌زند.
    if (isUniqueViolation(error)) {
      return Response.json({ error: "username_taken" }, { status: 409 });
    }
    throw error;
  }

  return noContent();
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}
