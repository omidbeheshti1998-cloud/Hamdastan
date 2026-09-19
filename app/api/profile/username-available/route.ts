import { isValidUsername } from "@/lib/profile";
import { badRequest } from "@/lib/server/request";
import { isUsernameTaken, suggestUsernames } from "@/lib/server/username";

/**
 * بررسی حین تایپ. نتیجه‌اش فقط UX است — بین این بررسی و ذخیره، ممکن است کسی
 * همان نام را بگیرد؛ حرف آخر را `POST /api/profile` و ایندکس یکتا می‌زنند.
 */
export async function GET(request: Request) {
  const username = new URL(request.url).searchParams.get("username") ?? "";
  if (!isValidUsername(username)) return badRequest("invalid_username");

  const taken = await isUsernameTaken(username);
  return Response.json({
    available: !taken,
    suggestions: taken ? await suggestUsernames(username) : [],
  });
}
