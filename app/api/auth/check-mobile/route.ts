import { prisma } from "@/lib/db";
import { badRequest, readJson, readMobile } from "@/lib/server/request";

/**
 * آیا این شماره حساب کامل دارد؟
 *
 * کاربری که وسط onboarding رها کرده ردیف دارد ولی `onboardedAt` ندارد؛ او
 * «ثبت‌نام‌نشده» حساب می‌شود تا دوباره به مسیر ثبت‌نام برود و کارش را تمام کند.
 */
export async function POST(request: Request) {
  const body = await readJson(request);
  const mobile = readMobile(body?.mobile);
  if (!mobile) return badRequest("invalid_mobile");

  const user = await prisma.user.findUnique({
    where: { mobile },
    select: { onboardedAt: true },
  });

  return Response.json({ registered: user?.onboardedAt != null });
}
