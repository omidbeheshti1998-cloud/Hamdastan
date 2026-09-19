import { prisma } from "@/lib/db";
import { consumeOtp } from "@/lib/server/otp";
import { badRequest, readJson, readMobile, readOtpCode } from "@/lib/server/request";
import { createSession } from "@/lib/server/session";

const NAME_MAX_LENGTH = 50;

function readName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const name = value.trim();
  return name.length > 0 && name.length <= NAME_MAX_LENGTH ? name : null;
}

/**
 * مسیر ثبت‌نام: تأیید کد و ساخت حساب در یک تراکنش.
 *
 * دو درخواست جدا نیست چون شکست بین تأیید و ساخت، یک کاربر بی‌نام در دیتابیس
 * جا می‌گذارد. `upsert` هم برای کسی است که قبلاً وسط onboarding رها کرده —
 * ردیفش هست، فقط `onboardedAt` ندارد.
 */
export async function POST(request: Request) {
  const body = await readJson(request);
  const mobile = readMobile(body?.mobile);
  const code = readOtpCode(body?.code);
  const firstName = readName(body?.firstName);
  const lastName = readName(body?.lastName);

  if (!mobile) return badRequest("invalid_mobile");
  if (!firstName || !lastName) return badRequest("invalid_name");
  if (!code) return Response.json({ ok: false });

  const user = await prisma.$transaction(async (tx) => {
    const verified = await consumeOtp(tx, mobile, code);
    if (!verified) return null;

    return tx.user.upsert({
      where: { mobile },
      create: { mobile, firstName, lastName },
      update: { firstName, lastName },
      select: { id: true },
    });
  });

  if (!user) return Response.json({ ok: false });

  await createSession(user.id);
  return Response.json({ ok: true });
}
