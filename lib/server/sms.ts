/**
 * تنها نقطهٔ تماس با سرویس پیامک.
 *
 * هیچ جای دیگری از اپ نباید با سرویس خارجی حرف بزند؛ وصل‌کردن پنل واقعی یعنی
 * اضافه‌کردن یک provider به همین فایل و عوض‌کردن `SMS_PROVIDER`.
 */

type SmsProvider = (mobile: string, text: string) => Promise<void>;

/** پیامکی فرستاده نمی‌شود؛ متن در لاگ سرور می‌آید تا در توسعه قابل خواندن باشد. */
const devProvider: SmsProvider = async (mobile, text) => {
  console.info(`[sms:dev] ${mobile} ← ${text}`);
};

const PROVIDERS: Record<string, SmsProvider> = {
  dev: devProvider,
};

export function isDevSms(): boolean {
  return process.env.SMS_PROVIDER === "dev";
}

export async function sendSms(mobile: string, text: string): Promise<void> {
  const provider = PROVIDERS[process.env.SMS_PROVIDER ?? ""];
  if (!provider) throw new Error(`unknown SMS_PROVIDER: ${process.env.SMS_PROVIDER}`);
  await provider(mobile, text);
}
