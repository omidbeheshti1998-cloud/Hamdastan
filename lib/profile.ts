/** قواعد و دادهٔ مرحلهٔ آخر onboarding: نام کاربری، آواتار و معرفی کوتاه. */

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;
export const BIO_MAX_LENGTH = 200;

/** حروف انگلیسی، عدد، نقطه و آندرلاین. فاصله مجاز نیست. */
const USERNAME_PATTERN = /^[a-zA-Z0-9._]+$/;

/** کاراکترهای غیرمجاز را همان موقعِ تایپ حذف می‌کند تا کاربر خطای بی‌فایده نبیند. */
export function sanitizeUsername(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9._]/g, "").slice(0, USERNAME_MAX_LENGTH);
}

export function isValidUsername(username: string): boolean {
  return (
    username.length >= USERNAME_MIN_LENGTH &&
    username.length <= USERNAME_MAX_LENGTH &&
    USERNAME_PATTERN.test(username)
  );
}

/** مجموعهٔ آواتارهای آماده. `id` پایدار است و همان چیزی است که به بک‌اند می‌رود. */
export type Avatar = { id: string; label: string };

export const AVATARS: Avatar[] = [
  { id: "fox", label: "روباه" },
  { id: "panda", label: "پاندا" },
  { id: "lion", label: "شیر" },
  { id: "tiger", label: "ببر" },
  { id: "bear", label: "خرس" },
  { id: "unicorn", label: "اسب تک‌شاخ" },
  { id: "dolphin", label: "دلفین" },
  { id: "butterfly", label: "پروانه" },
  { id: "sun", label: "خورشید" },
  { id: "moon", label: "ماه" },
  { id: "flower", label: "گل" },
  { id: "star", label: "ستاره" },
];

/** یک آواتار تصادفی از ست. فقط در event handler صدا زده می‌شود، نه هنگام رندر. */
export function randomAvatarId(): string {
  return AVATARS[Math.floor(Math.random() * AVATARS.length)].id;
}

/**
 * آواتار انتخابی کاربر. هنگام ورود به مرحلهٔ آخر یکی به‌صورت تصادفی انتخاب
 * می‌شود، پس در عمل `null` نمی‌ماند؛ کاربر می‌تواند عوضش کند.
 */
export type AvatarChoice =
  | { kind: "preset"; id: string }
  | { kind: "photo"; url: string; blob: Blob }
  | null;

export type ProfileIdentity = {
  username: string;
  avatar: AvatarChoice;
  bio: string;
};
