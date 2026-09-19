import { issueOtp, OtpRateLimitError } from "@/lib/server/otp";
import { badRequest, noContent, readJson, readMobile } from "@/lib/server/request";

export async function POST(request: Request) {
  const body = await readJson(request);
  const mobile = readMobile(body?.mobile);
  if (!mobile) return badRequest("invalid_mobile");

  try {
    await issueOtp(mobile);
  } catch (error) {
    if (error instanceof OtpRateLimitError) {
      return Response.json({ error: "rate_limited" }, { status: 429 });
    }
    throw error;
  }

  return noContent();
}
