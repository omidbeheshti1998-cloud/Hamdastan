import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { hashToken } from "./hash";

const COOKIE_NAME = "session";
const DEFAULT_MAX_AGE_DAYS = 7;

function maxAgeDays(): number {
  const configured = Number(process.env.SESSION_MAX_AGE_DAYS);
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_MAX_AGE_DAYS;
}

/**
 * ساخت نشست و ست‌کردن کوکی.
 *
 * کوکی مقدار خام توکن را دارد و دیتابیس فقط هشش را، تا دامپ دیتابیس به‌تنهایی
 * اجازهٔ جعل نشست ندهد. `httpOnly` است تا از دسترس جاوااسکریپت — و در نتیجه از
 * دسترس XSS — بیرون بماند.
 */
export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + maxAgeDays() * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: { userId, tokenHash: hashToken(token), expiresAt },
  });

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

/**
 * شناسهٔ کاربرِ نشست جاری، یا `null`.
 *
 * تنها منبع هویت در اندپوینت‌هاست. هیچ اندپوینتی نباید شماره یا شناسهٔ کاربر را
 * از بدنهٔ درخواست بخواند — آن مقدار را فرستنده انتخاب می‌کند، نه ما.
 */
export async function currentUserId(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { userId: true, expiresAt: true },
  });
  if (!session || session.expiresAt <= new Date()) return null;

  return session.userId;
}
