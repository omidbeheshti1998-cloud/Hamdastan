import { prisma } from "@/lib/db";
import { consumeOtp } from "@/lib/server/otp";
import { badRequest, readJson, readMobile, readOtpCode } from "@/lib/server/request";
import { createSession } from "@/lib/server/session";

/**
 * مسیر ورود: تأیید کد برای شماره‌ای که از قبل حساب دارد.
 * ساخت حساب اینجا انجام نمی‌شود — آن کار `POST /api/auth/register` است.
 *
 * کد اشتباه خطا نیست و با `{ ok: false }` برمی‌گردد؛ فقط خطای واقعی سرور
 * باید به کلاینت به‌صورت خطا برسد.
 */
export async function POST(request: Request) {
  const body = await readJson(request);
  const mobile = readMobile(body?.mobile);
  const code = readOtpCode(body?.code);
  if (!mobile) return badRequest("invalid_mobile");
  if (!code) return Response.json({ ok: false });

  const verified = await consumeOtp(prisma, mobile, code);
  if (!verified) return Response.json({ ok: false });

  const user = await prisma.user.findUnique({
    where: { mobile },
    select: { id: true },
  });
  // کد درست بود ولی حسابی نیست — یعنی کلاینت مسیر را اشتباه رفته.
  if (!user) return Response.json({ ok: false });

  await createSession(user.id);
  return Response.json({ ok: true });
}
